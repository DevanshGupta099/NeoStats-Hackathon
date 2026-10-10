import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { DomainEventBus } from '../../common/events/domain-event-bus';
import {
  AddProjectMemberInput,
  UpdateProjectMemberInput,
  ProjectRole,
  GlobalRole,
  RealtimeEvents,
  ErrorCode,
} from '@forgeline/shared';
import { AuthenticatedUser } from '../auth/decorators/current-user.decorator';

@Injectable()
export class MembersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly eventBus: DomainEventBus,
  ) {}

  async listMembers(projectId: string) {
    const members = await this.prisma.projectMember.findMany({
      where: { projectId },
      orderBy: { createdAt: 'asc' },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            handle: true,
            email: true,
            avatarSeed: true,
            globalRole: true,
            isActive: true,
          },
        },
      },
    });

    return members;
  }

  async addMember(
    projectId: string,
    dto: AddProjectMemberInput,
    actor: AuthenticatedUser,
  ) {
    // Only Admin can assign the Project Manager role
    if (dto.projectRole === ProjectRole.MANAGER && actor.globalRole !== GlobalRole.ADMIN) {
      throw new ForbiddenException({
        code: ErrorCode.FORBIDDEN,
        message: 'Only system administrators can designate a Project Manager',
      });
    }

    const targetUser = await this.prisma.user.findUnique({
      where: { id: dto.userId },
    });
    if (!targetUser) {
      throw new NotFoundException({
        code: ErrorCode.NOT_FOUND,
        message: 'User to add was not found',
      });
    }

    const existingMember = await this.prisma.projectMember.findUnique({
      where: {
        projectId_userId: { projectId, userId: dto.userId },
      },
    });
    if (existingMember) {
      throw new ConflictException({
        code: ErrorCode.VALIDATION_ERROR,
        message: 'User is already a member of this project',
      });
    }

    const result = await this.prisma.$transaction(async (tx) => {
      const member = await tx.projectMember.create({
        data: {
          projectId,
          userId: dto.userId,
          projectRole: dto.projectRole,
          addedBy: actor.id,
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              handle: true,
              email: true,
              avatarSeed: true,
              globalRole: true,
            },
          },
          project: {
            select: { name: true, key: true },
          },
        },
      });

      // Write activity log
      await tx.activityLog.create({
        data: {
          userId: actor.id,
          projectId,
          action: 'member.added',
          entityType: 'project_member',
          entityId: member.id,
          metadata: {
            targetUserId: dto.userId,
            projectRole: dto.projectRole,
          },
        },
      });

      // Notify the added user (if not the actor themselves)
      if (dto.userId !== actor.id) {
        await tx.notification.create({
          data: {
            userId: dto.userId,
            actorId: actor.id,
            projectId,
            type: 'member.added',
            entityType: 'project',
            entityId: projectId,
            payload: {
              projectName: member.project.name,
              projectKey: member.project.key,
              role: dto.projectRole,
            },
          },
        });
      }

      return member;
    });

    this.eventBus.publish({
      event: RealtimeEvents.MEMBER_ADDED,
      projectId,
      actorId: actor.id,
      entityId: result.id,
      timestamp: new Date().toISOString(),
      data: result,
    });

    return result;
  }

  async updateMemberRole(
    projectId: string,
    targetUserId: string,
    dto: UpdateProjectMemberInput,
    actor: AuthenticatedUser,
  ) {
    if (dto.projectRole === ProjectRole.MANAGER && actor.globalRole !== GlobalRole.ADMIN) {
      throw new ForbiddenException({
        code: ErrorCode.FORBIDDEN,
        message: 'Only system administrators can designate a Project Manager',
      });
    }

    const membership = await this.prisma.projectMember.findUnique({
      where: {
        projectId_userId: { projectId, userId: targetUserId },
      },
    });
    if (!membership) {
      throw new NotFoundException({
        code: ErrorCode.NOT_FOUND,
        message: 'Project membership not found',
      });
    }

    const result = await this.prisma.$transaction(async (tx) => {
      const updated = await tx.projectMember.update({
        where: {
          projectId_userId: { projectId, userId: targetUserId },
        },
        data: {
          projectRole: dto.projectRole,
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              handle: true,
              email: true,
              avatarSeed: true,
              globalRole: true,
            },
          },
          project: {
            select: { name: true, key: true },
          },
        },
      });

      await tx.activityLog.create({
        data: {
          userId: actor.id,
          projectId,
          action: 'member.role_changed',
          entityType: 'project_member',
          entityId: updated.id,
          metadata: {
            targetUserId,
            previousRole: membership.projectRole,
            newRole: dto.projectRole,
          },
        },
      });

      if (targetUserId !== actor.id) {
        await tx.notification.create({
          data: {
            userId: targetUserId,
            actorId: actor.id,
            projectId,
            type: 'member.role_changed',
            entityType: 'project',
            entityId: projectId,
            payload: {
              projectName: updated.project.name,
              projectKey: updated.project.key,
              role: dto.projectRole,
            },
          },
        });
      }

      return updated;
    });

    this.eventBus.publish({
      event: RealtimeEvents.MEMBER_ROLE_CHANGED,
      projectId,
      actorId: actor.id,
      entityId: result.id,
      timestamp: new Date().toISOString(),
      data: result,
    });

    return result;
  }

  async removeMember(
    projectId: string,
    targetUserId: string,
    actor: AuthenticatedUser,
  ) {
    const membership = await this.prisma.projectMember.findUnique({
      where: {
        projectId_userId: { projectId, userId: targetUserId },
      },
      include: {
        project: { select: { name: true, key: true } },
      },
    });

    if (!membership) {
      throw new NotFoundException({
        code: ErrorCode.NOT_FOUND,
        message: 'Project membership not found',
      });
    }

    // Safety check: Prevent removing the last manager of an active project
    if (membership.projectRole === ProjectRole.MANAGER) {
      const managerCount = await this.prisma.projectMember.count({
        where: { projectId, projectRole: ProjectRole.MANAGER },
      });
      if (managerCount <= 1) {
        throw new BadRequestException({
          code: ErrorCode.VALIDATION_ERROR,
          message: 'Cannot remove the sole Project Manager from an active project',
        });
      }
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.projectMember.delete({
        where: {
          projectId_userId: { projectId, userId: targetUserId },
        },
      });

      await tx.activityLog.create({
        data: {
          userId: actor.id,
          projectId,
          action: 'member.removed',
          entityType: 'project_member',
          entityId: membership.id,
          metadata: { targetUserId },
        },
      });

      if (targetUserId !== actor.id) {
        await tx.notification.create({
          data: {
            userId: targetUserId,
            actorId: actor.id,
            projectId,
            type: 'member.removed',
            entityType: 'project',
            entityId: projectId,
            payload: {
              projectName: membership.project.name,
              projectKey: membership.project.key,
            },
          },
        });
      }
    });

    this.eventBus.publish({
      event: RealtimeEvents.MEMBER_REMOVED,
      projectId,
      actorId: actor.id,
      entityId: membership.id,
      timestamp: new Date().toISOString(),
      data: { projectId, userId: targetUserId },
    });

    return { message: 'Member removed from project successfully' };
  }
}
