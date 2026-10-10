import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { PrismaService } from '../prisma/prisma.service';
import { PolicyService } from './policy.service';
import { PERMISSION_KEY } from './require-permission.decorator';
import { Permission, GlobalRole, PolicyContext, ProjectRole } from '@forgeline/shared';
import { AuthenticatedUser } from '../../modules/auth/decorators/current-user.decorator';

@Injectable()
export class PolicyGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly policyService: PolicyService,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredPermission = this.reflector.getAllAndOverride<Permission>(PERMISSION_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredPermission) {
      return true; // No policy restriction declared
    }

    const req = context.switchToHttp().getRequest<Request & { user?: AuthenticatedUser }>();
    const user = req.user;

    if (!user) {
      throw new UnauthorizedException({
        code: 'UNAUTHORIZED',
        message: 'Authentication required for this operation',
      });
    }

    if (!user.isActive) {
      throw new ForbiddenException({
        code: 'ACCOUNT_DEACTIVATED',
        message: 'Account is deactivated',
      });
    }

    // Admin has full system capabilities
    if (user.globalRole === GlobalRole.ADMIN) {
      return true;
    }

    const url = req.originalUrl || req.url || '';
    const getParam = (val: string | string[] | undefined): string | undefined =>
      Array.isArray(val) ? val[0] : val;

    let projectId: string | undefined = getParam(req.params.projectId);
    let resource: PolicyContext['resource'] = null;

    // 1. Resolve task context
    const rawTaskId = getParam(req.params.taskId) || (url.includes('/tasks/') && !url.includes('/projects/') ? getParam(req.params.id) : undefined);
    const taskId = typeof rawTaskId === 'string' ? rawTaskId : undefined;
    if (taskId && taskId !== 'mine') {
      const task = await this.prisma.task.findUnique({
        where: { id: taskId },
        select: { id: true, projectId: true, assigneeId: true, deletedAt: true },
      });

      if (!task || task.deletedAt) {
        throw new NotFoundException({
          code: 'NOT_FOUND',
          message: 'Task not found',
        });
      }

      projectId = task.projectId;
      resource = {
        projectId: task.projectId,
        assigneeId: task.assigneeId,
      };
    }

    // 2. Resolve comment context
    const rawCommentId = getParam(req.params.commentId) || (url.includes('/comments/') ? getParam(req.params.id) : undefined);
    const commentId = typeof rawCommentId === 'string' ? rawCommentId : undefined;
    if (commentId) {
      const comment = await this.prisma.comment.findUnique({
        where: { id: commentId },
        select: { id: true, projectId: true, authorId: true, deletedAt: true },
      });

      if (!comment || comment.deletedAt) {
        throw new NotFoundException({
          code: 'NOT_FOUND',
          message: 'Comment not found',
        });
      }

      projectId = comment.projectId;
      resource = {
        projectId: comment.projectId,
        authorId: comment.authorId,
      };
    }

    // 3. Resolve project context if not yet resolved
    if (!projectId && (url.includes('/projects/') || url.startsWith('/projects/'))) {
      projectId = getParam(req.params.id) || getParam(req.params.projectId);
    }

    // Check project scoping if projectId was resolved
    let projectMember: PolicyContext['projectMember'] = null;
    if (projectId) {
      const project = await this.prisma.project.findUnique({
        where: { id: projectId },
        select: { id: true },
      });

      if (!project) {
        throw new NotFoundException({
          code: 'NOT_FOUND',
          message: 'Project not found',
        });
      }

      const membership = await this.prisma.projectMember.findUnique({
        where: {
          projectId_userId: { projectId, userId: user.id },
        },
      });

      if (!membership) {
        // Non-members receive 404 so they cannot discover inaccessible projects
        throw new NotFoundException({
          code: 'NOT_FOUND',
          message: 'Project not found',
        });
      }

      projectMember = {
        projectId: membership.projectId,
        userId: membership.userId,
        projectRole: membership.projectRole as ProjectRole,
      };
    }

    const policyContext: PolicyContext = {
      user: {
        id: user.id,
        globalRole: user.globalRole as GlobalRole,
        isActive: user.isActive,
      },
      projectMember,
      resource,
    };

    const isAllowed = this.policyService.can(requiredPermission, policyContext);

    if (!isAllowed) {
      throw new ForbiddenException({
        code: 'FORBIDDEN',
        message: 'You do not have permission to perform this action',
      });
    }

    return true;
  }
}
