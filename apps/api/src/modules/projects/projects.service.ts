import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { DomainEventBus } from '../../common/events/domain-event-bus';
import {
  CreateProjectInput,
  UpdateProjectInput,
  ProjectStatus,
  ProjectRole,
  GlobalRole,
  RealtimeEvents,
  ErrorCode,
  TaskStatus,
} from '@forgeline/shared';
import { extractVersion } from '../../common/concurrency/version.helper';

@Injectable()
export class ProjectsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly eventBus: DomainEventBus,
  ) {}

  async listProjects(user: { id: string; globalRole: GlobalRole | string }, query: {
    status?: ProjectStatus;
    search?: string;
    mine?: boolean;
  }) {
    const where: Record<string, unknown> = {};

    if (query.status) {
      where.status = query.status;
    } else {
      // Default to ACTIVE unless specified
      where.status = ProjectStatus.ACTIVE;
    }

    if (query.search) {
      const search = query.search.trim();
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { key: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Role-scoping: Admin can see all, others only see projects where they are members
    if (user.globalRole !== GlobalRole.ADMIN || query.mine) {
      where.members = {
        some: {
          userId: user.id,
        },
      };
    }

    const projects = await this.prisma.project.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: {
            tasks: { where: { deletedAt: null } },
            members: true,
          },
        },
      },
    });

    return projects.map((p) => ({
      ...p,
      taskCount: p._count.tasks,
      memberCount: p._count.members,
    }));
  }

  async getProject(id: string) {
    const project = await this.prisma.project.findFirst({
      where: {
        OR: [{ id }, { key: id.toUpperCase() }],
      },
      include: {
        creator: {
          select: { id: true, name: true, handle: true, email: true },
        },
        members: {
          include: {
            user: {
              select: { id: true, name: true, handle: true, email: true, avatarSeed: true },
            },
          },
        },
        _count: {
          select: {
            tasks: { where: { deletedAt: null } },
            members: true,
          },
        },
      },
    });

    if (!project) {
      throw new NotFoundException({
        code: ErrorCode.NOT_FOUND,
        message: 'Project not found',
      });
    }

    return {
      ...project,
      taskCount: project._count.tasks,
      memberCount: project._count.members,
    };
  }

  async createProject(dto: CreateProjectInput, actorId: string) {
    const key = dto.key.toUpperCase().trim();

    const existingKey = await this.prisma.project.findUnique({
      where: { key },
    });
    if (existingKey) {
      throw new ConflictException({
        code: ErrorCode.VALIDATION_ERROR,
        message: `Project with key '${key}' already exists`,
      });
    }

    const project = await this.prisma.$transaction(async (tx) => {
      const created = await tx.project.create({
        data: {
          name: dto.name.trim(),
          key,
          description: dto.description?.trim(),
          createdBy: actorId,
          version: 1,
        },
      });

      // Automatically add creator as project MANAGER
      await tx.projectMember.create({
        data: {
          projectId: created.id,
          userId: actorId,
          projectRole: ProjectRole.MANAGER,
          addedBy: actorId,
        },
      });

      // Transactional activity log
      await tx.activityLog.create({
        data: {
          userId: actorId,
          projectId: created.id,
          action: 'project.created',
          entityType: 'project',
          entityId: created.id,
          metadata: { name: created.name, key: created.key },
        },
      });

      return created;
    });

    this.eventBus.publish({
      event: RealtimeEvents.PROJECT_UPDATED,
      projectId: project.id,
      actorId,
      entityId: project.id,
      version: project.version,
      timestamp: new Date().toISOString(),
      data: project,
    });

    return project;
  }

  async updateProject(
    id: string,
    dto: UpdateProjectInput,
    actorId: string,
    ifMatchHeader?: string,
  ) {
    const version = extractVersion(dto.version, ifMatchHeader);

    const result = await this.prisma.$transaction(async (tx) => {
      const updateResult = await tx.project.updateMany({
        where: { id, version },
        data: {
          name: dto.name?.trim(),
          description: dto.description?.trim(),
          status: dto.status,
          version: { increment: 1 },
        },
      });

      if (updateResult.count === 0) {
        const current = await tx.project.findUnique({ where: { id } });
        if (!current) {
          throw new NotFoundException({
            code: ErrorCode.NOT_FOUND,
            message: 'Project not found',
          });
        }
        throw new ConflictException({
          code: ErrorCode.VERSION_CONFLICT,
          message: 'The project has been modified by another user',
          details: {
            current,
            yourVersion: version,
            currentVersion: current.version,
          },
        });
      }

      const updated = await tx.project.findUniqueOrThrow({ where: { id } });

      await tx.activityLog.create({
        data: {
          userId: actorId,
          projectId: id,
          action: 'project.updated',
          entityType: 'project',
          entityId: id,
          metadata: { beforeVersion: version, afterVersion: updated.version, changes: dto },
        },
      });

      return updated;
    });

    this.eventBus.publish({
      event: RealtimeEvents.PROJECT_UPDATED,
      projectId: result.id,
      actorId,
      entityId: result.id,
      version: result.version,
      timestamp: new Date().toISOString(),
      data: result,
    });

    return result;
  }

  async archiveProject(id: string, actorId: string) {
    const project = await this.prisma.project.findUnique({ where: { id } });
    if (!project) {
      throw new NotFoundException({
        code: ErrorCode.NOT_FOUND,
        message: 'Project not found',
      });
    }

    if (project.status === ProjectStatus.ARCHIVED) {
      throw new BadRequestException({
        code: ErrorCode.VALIDATION_ERROR,
        message: 'Project is already archived',
      });
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      const res = await tx.project.update({
        where: { id },
        data: {
          status: ProjectStatus.ARCHIVED,
          archivedAt: new Date(),
          version: { increment: 1 },
        },
      });

      await tx.activityLog.create({
        data: {
          userId: actorId,
          projectId: id,
          action: 'project.archived',
          entityType: 'project',
          entityId: id,
          metadata: {},
        },
      });

      return res;
    });

    this.eventBus.publish({
      event: RealtimeEvents.PROJECT_ARCHIVED,
      projectId: id,
      actorId,
      entityId: id,
      version: updated.version,
      timestamp: new Date().toISOString(),
      data: updated,
    });

    return updated;
  }

  async restoreProject(id: string, actorId: string) {
    const project = await this.prisma.project.findUnique({ where: { id } });
    if (!project) {
      throw new NotFoundException({
        code: ErrorCode.NOT_FOUND,
        message: 'Project not found',
      });
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      const res = await tx.project.update({
        where: { id },
        data: {
          status: ProjectStatus.ACTIVE,
          archivedAt: null,
          version: { increment: 1 },
        },
      });

      await tx.activityLog.create({
        data: {
          userId: actorId,
          projectId: id,
          action: 'project.restored',
          entityType: 'project',
          entityId: id,
          metadata: {},
        },
      });

      return res;
    });

    this.eventBus.publish({
      event: RealtimeEvents.PROJECT_UPDATED,
      projectId: id,
      actorId,
      entityId: id,
      version: updated.version,
      timestamp: new Date().toISOString(),
      data: updated,
    });

    return updated;
  }

  async getProjectStats(id: string) {
    const project = await this.prisma.project.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!project) {
      throw new NotFoundException({
        code: ErrorCode.NOT_FOUND,
        message: 'Project not found',
      });
    }

    const [taskStats, memberCount] = await Promise.all([
      this.prisma.task.groupBy({
        by: ['status'],
        where: { projectId: id, deletedAt: null },
        _count: { status: true },
      }),
      this.prisma.projectMember.count({ where: { projectId: id } }),
    ]);

    const counts: Record<TaskStatus, number> = {
      [TaskStatus.BACKLOG]: 0,
      [TaskStatus.TODO]: 0,
      [TaskStatus.IN_PROGRESS]: 0,
      [TaskStatus.IN_REVIEW]: 0,
      [TaskStatus.DONE]: 0,
    };

    let totalTasks = 0;
    for (const item of taskStats) {
      counts[item.status] = item._count.status;
      totalTasks += item._count.status;
    }

    const completedTasks = counts[TaskStatus.DONE];
    const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    return {
      projectId: id,
      counts,
      totalTasks,
      completedTasks,
      completionRate,
      memberCount,
    };
  }
}
