import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { DomainEventBus } from '../../common/events/domain-event-bus';
import {
  CreateTaskInput,
  UpdateTaskInput,
  ChangeTaskStatusInput,
  AssignTaskInput,
  MoveTaskInput,
  TaskStatus,
  TaskPriority,
  RealtimeEvents,
  ErrorCode,
} from '@forgeline/shared';
import { extractVersion } from '../../common/concurrency/version.helper';

@Injectable()
export class TasksService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly eventBus: DomainEventBus,
  ) {}

  async listTasks(
    projectId: string,
    query: {
      status?: TaskStatus;
      priority?: TaskPriority;
      assigneeId?: string;
      search?: string;
      cursor?: string;
      limit?: number;
    },
  ) {
    const limit = query.limit ? Math.min(Math.max(query.limit, 1), 100) : 25;
    const where: Record<string, unknown> = {
      projectId,
      deletedAt: null,
    };

    if (query.status) {
      where.status = query.status;
    }
    if (query.priority) {
      where.priority = query.priority;
    }
    if (query.assigneeId) {
      where.assigneeId = query.assigneeId;
    }

    if (query.search) {
      const search = query.search.trim();
      const numberSearch = parseInt(search.replace('#', ''), 10);

      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        ...(!isNaN(numberSearch) ? [{ number: numberSearch }] : []),
      ];
    }

    const items = await this.prisma.task.findMany({
      where,
      take: limit + 1,
      cursor: query.cursor ? { id: query.cursor } : undefined,
      skip: query.cursor ? 1 : 0,
      orderBy: [{ position: 'asc' }, { createdAt: 'desc' }],
      include: {
        assignee: {
          select: { id: true, name: true, handle: true, email: true, avatarSeed: true },
        },
        reporter: {
          select: { id: true, name: true, handle: true, email: true, avatarSeed: true },
        },
        _count: {
          select: { comments: { where: { deletedAt: null } } },
        },
      },
    });

    let nextCursor: string | null = null;
    if (items.length > limit) {
      const nextItem = items.pop();
      nextCursor = nextItem ? nextItem.id : null;
    }

    const totalCount = await this.prisma.task.count({ where });

    return {
      items: items.map((t) => ({ ...t, commentCount: t._count.comments })),
      nextCursor,
      totalCount,
    };
  }

  async getMyTasks(userId: string) {
    const tasks = await this.prisma.task.findMany({
      where: {
        assigneeId: userId,
        deletedAt: null,
        project: {
          members: {
            some: { userId },
          },
        },
      },
      orderBy: [{ dueDate: 'asc' }, { createdAt: 'desc' }],
      include: {
        project: {
          select: { id: true, key: true, name: true },
        },
        assignee: {
          select: { id: true, name: true, handle: true, avatarSeed: true },
        },
        reporter: {
          select: { id: true, name: true, handle: true, avatarSeed: true },
        },
      },
    });

    return tasks;
  }

  async getTask(id: string) {
    const task = await this.prisma.task.findFirst({
      where: { id, deletedAt: null },
      include: {
        project: {
          select: { id: true, key: true, name: true },
        },
        assignee: {
          select: { id: true, name: true, handle: true, email: true, avatarSeed: true },
        },
        reporter: {
          select: { id: true, name: true, handle: true, email: true, avatarSeed: true },
        },
        _count: {
          select: { comments: { where: { deletedAt: null } } },
        },
      },
    });

    if (!task) {
      throw new NotFoundException({
        code: ErrorCode.NOT_FOUND,
        message: 'Task not found',
      });
    }

    return {
      ...task,
      commentCount: task._count.comments,
    };
  }

  async createTask(
    projectId: string,
    dto: CreateTaskInput,
    actorId: string,
  ) {
    const result = await this.prisma.$transaction(async (tx) => {
      // 1. Race-safe atomic increment of project taskCounter
      const project = await tx.project.update({
        where: { id: projectId },
        data: { taskCounter: { increment: 1 } },
        select: { id: true, key: true, name: true, taskCounter: true },
      });

      const taskNumber = project.taskCounter;

      // 2. Create task
      const task = await tx.task.create({
        data: {
          projectId,
          number: taskNumber,
          title: dto.title.trim(),
          description: dto.description?.trim(),
          status: dto.status || TaskStatus.BACKLOG,
          priority: dto.priority || TaskPriority.MEDIUM,
          assigneeId: dto.assigneeId || null,
          reporterId: actorId,
          dueDate: dto.dueDate ? new Date(dto.dueDate) : null,
          position: dto.position ?? 1000,
          version: 1,
        },
        include: {
          assignee: {
            select: { id: true, name: true, handle: true, email: true, avatarSeed: true },
          },
          reporter: {
            select: { id: true, name: true, handle: true, email: true, avatarSeed: true },
          },
        },
      });

      // 3. Activity log
      await tx.activityLog.create({
        data: {
          userId: actorId,
          projectId,
          action: 'task.created',
          entityType: 'task',
          entityId: task.id,
          metadata: {
            taskNumber: task.number,
            title: task.title,
            status: task.status,
            priority: task.priority,
          },
        },
      });

      // 4. Notification to assignee if assigned to someone else
      if (dto.assigneeId && dto.assigneeId !== actorId) {
        await tx.notification.create({
          data: {
            userId: dto.assigneeId,
            actorId,
            projectId,
            type: 'task.assigned',
            entityType: 'task',
            entityId: task.id,
            payload: {
              taskNumber: task.number,
              taskTitle: task.title,
              projectKey: project.key,
            },
          },
        });
      }

      return { task, project };
    });

    // 5. Post-commit event emission
    this.eventBus.publish({
      event: RealtimeEvents.TASK_CREATED,
      projectId,
      actorId,
      entityId: result.task.id,
      version: result.task.version,
      timestamp: new Date().toISOString(),
      data: result.task,
    });

    return result.task;
  }

  async updateTask(
    id: string,
    dto: UpdateTaskInput,
    actorId: string,
    ifMatchHeader?: string,
  ) {
    const version = extractVersion(dto.version, ifMatchHeader);

    const result = await this.prisma.$transaction(async (tx) => {
      const existing = await tx.task.findUnique({
        where: { id },
        include: { project: { select: { key: true, name: true } } },
      });

      if (!existing || existing.deletedAt) {
        throw new NotFoundException({
          code: ErrorCode.NOT_FOUND,
          message: 'Task not found',
        });
      }

      // Atomic update with version check
      const updateResult = await tx.task.updateMany({
        where: { id, version, deletedAt: null },
        data: {
          title: dto.title?.trim(),
          description: dto.description !== undefined ? dto.description?.trim() : undefined,
          priority: dto.priority,
          status: dto.status,
          assigneeId: dto.assigneeId !== undefined ? dto.assigneeId : undefined,
          dueDate: dto.dueDate !== undefined ? (dto.dueDate ? new Date(dto.dueDate) : null) : undefined,
          position: dto.position,
          version: { increment: 1 },
        },
      });

      if (updateResult.count === 0) {
        const current = await tx.task.findUniqueOrThrow({ where: { id } });
        throw new ConflictException({
          code: ErrorCode.VERSION_CONFLICT,
          message: 'The task has been modified by another user',
          details: {
            current,
            yourVersion: version,
            currentVersion: current.version,
          },
        });
      }

      const updated = await tx.task.findUniqueOrThrow({
        where: { id },
        include: {
          assignee: {
            select: { id: true, name: true, handle: true, email: true, avatarSeed: true },
          },
          reporter: {
            select: { id: true, name: true, handle: true, email: true, avatarSeed: true },
          },
        },
      });

      // Activity log
      await tx.activityLog.create({
        data: {
          userId: actorId,
          projectId: updated.projectId,
          action: 'task.updated',
          entityType: 'task',
          entityId: id,
          metadata: {
            taskNumber: updated.number,
            beforeVersion: version,
            afterVersion: updated.version,
            changes: dto,
          },
        },
      });

      // Notification if assignee changed
      if (
        dto.assigneeId !== undefined &&
        dto.assigneeId !== existing.assigneeId &&
        dto.assigneeId &&
        dto.assigneeId !== actorId
      ) {
        await tx.notification.create({
          data: {
            userId: dto.assigneeId,
            actorId,
            projectId: updated.projectId,
            type: 'task.assigned',
            entityType: 'task',
            entityId: id,
            payload: {
              taskNumber: updated.number,
              taskTitle: updated.title,
              projectKey: existing.project.key,
            },
          },
        });
      }

      return updated;
    });

    this.eventBus.publish({
      event: RealtimeEvents.TASK_UPDATED,
      projectId: result.projectId,
      actorId,
      entityId: result.id,
      version: result.version,
      timestamp: new Date().toISOString(),
      data: result,
    });

    return result;
  }

  async assignTask(
    id: string,
    dto: AssignTaskInput,
    actorId: string,
    ifMatchHeader?: string,
  ) {
    const version = extractVersion(dto.version, ifMatchHeader);

    const result = await this.prisma.$transaction(async (tx) => {
      const existing = await tx.task.findUnique({
        where: { id },
        include: { project: { select: { key: true, name: true } } },
      });

      if (!existing || existing.deletedAt) {
        throw new NotFoundException({
          code: ErrorCode.NOT_FOUND,
          message: 'Task not found',
        });
      }

      const updateResult = await tx.task.updateMany({
        where: { id, version, deletedAt: null },
        data: {
          assigneeId: dto.assigneeId,
          version: { increment: 1 },
        },
      });

      if (updateResult.count === 0) {
        const current = await tx.task.findUniqueOrThrow({ where: { id } });
        throw new ConflictException({
          code: ErrorCode.VERSION_CONFLICT,
          message: 'The task has been modified by another user',
          details: {
            current,
            yourVersion: version,
            currentVersion: current.version,
          },
        });
      }

      const updated = await tx.task.findUniqueOrThrow({
        where: { id },
        include: {
          assignee: {
            select: { id: true, name: true, handle: true, email: true, avatarSeed: true },
          },
        },
      });

      await tx.activityLog.create({
        data: {
          userId: actorId,
          projectId: updated.projectId,
          action: 'task.assigned',
          entityType: 'task',
          entityId: id,
          metadata: {
            taskNumber: updated.number,
            previousAssigneeId: existing.assigneeId,
            newAssigneeId: dto.assigneeId,
          },
        },
      });

      if (dto.assigneeId && dto.assigneeId !== actorId) {
        await tx.notification.create({
          data: {
            userId: dto.assigneeId,
            actorId,
            projectId: updated.projectId,
            type: 'task.assigned',
            entityType: 'task',
            entityId: id,
            payload: {
              taskNumber: updated.number,
              taskTitle: updated.title,
              projectKey: existing.project.key,
            },
          },
        });
      }

      return updated;
    });

    this.eventBus.publish({
      event: RealtimeEvents.TASK_ASSIGNED,
      projectId: result.projectId,
      actorId,
      entityId: result.id,
      version: result.version,
      timestamp: new Date().toISOString(),
      data: result,
    });

    return result;
  }

  async changeTaskStatus(
    id: string,
    dto: ChangeTaskStatusInput,
    actorId: string,
    ifMatchHeader?: string,
  ) {
    const version = extractVersion(dto.version, ifMatchHeader);

    const result = await this.prisma.$transaction(async (tx) => {
      const existing = await tx.task.findUnique({
        where: { id },
        include: { project: { select: { key: true, name: true } } },
      });

      if (!existing || existing.deletedAt) {
        throw new NotFoundException({
          code: ErrorCode.NOT_FOUND,
          message: 'Task not found',
        });
      }

      const updateResult = await tx.task.updateMany({
        where: { id, version, deletedAt: null },
        data: {
          status: dto.status,
          version: { increment: 1 },
        },
      });

      if (updateResult.count === 0) {
        const current = await tx.task.findUniqueOrThrow({ where: { id } });
        throw new ConflictException({
          code: ErrorCode.VERSION_CONFLICT,
          message: 'The task has been modified by another user',
          details: {
            current,
            yourVersion: version,
            currentVersion: current.version,
          },
        });
      }

      const updated = await tx.task.findUniqueOrThrow({
        where: { id },
        include: {
          assignee: {
            select: { id: true, name: true, handle: true, email: true, avatarSeed: true },
          },
        },
      });

      await tx.activityLog.create({
        data: {
          userId: actorId,
          projectId: updated.projectId,
          action: 'task.status_changed',
          entityType: 'task',
          entityId: id,
          metadata: {
            taskNumber: updated.number,
            previousStatus: existing.status,
            newStatus: dto.status,
          },
        },
      });

      // Notify assignee and reporter if not actor
      const recipients = new Set<string>();
      if (existing.assigneeId && existing.assigneeId !== actorId) {
        recipients.add(existing.assigneeId);
      }
      if (existing.reporterId && existing.reporterId !== actorId) {
        recipients.add(existing.reporterId);
      }

      for (const recipientId of recipients) {
        await tx.notification.create({
          data: {
            userId: recipientId,
            actorId,
            projectId: updated.projectId,
            type: 'task.status_changed',
            entityType: 'task',
            entityId: id,
            payload: {
              taskNumber: updated.number,
              taskTitle: updated.title,
              projectKey: existing.project.key,
              previousStatus: existing.status,
              newStatus: dto.status,
            },
          },
        });
      }

      return updated;
    });

    this.eventBus.publish({
      event: RealtimeEvents.TASK_STATUS_CHANGED,
      projectId: result.projectId,
      actorId,
      entityId: result.id,
      version: result.version,
      timestamp: new Date().toISOString(),
      data: result,
    });

    return result;
  }

  async moveTask(
    id: string,
    dto: MoveTaskInput,
    actorId: string,
    ifMatchHeader?: string,
  ) {
    const version = extractVersion(dto.version, ifMatchHeader);

    const result = await this.prisma.$transaction(async (tx) => {
      const existing = await tx.task.findUnique({
        where: { id },
        include: { project: { select: { key: true, name: true } } },
      });

      if (!existing || existing.deletedAt) {
        throw new NotFoundException({
          code: ErrorCode.NOT_FOUND,
          message: 'Task not found',
        });
      }

      const updateResult = await tx.task.updateMany({
        where: { id, version, deletedAt: null },
        data: {
          status: dto.status,
          position: dto.position,
          version: { increment: 1 },
        },
      });

      if (updateResult.count === 0) {
        const current = await tx.task.findUniqueOrThrow({ where: { id } });
        throw new ConflictException({
          code: ErrorCode.VERSION_CONFLICT,
          message: 'The task has been modified by another user',
          details: {
            current,
            yourVersion: version,
            currentVersion: current.version,
          },
        });
      }

      const updated = await tx.task.findUniqueOrThrow({
        where: { id },
        include: {
          assignee: {
            select: { id: true, name: true, handle: true, email: true, avatarSeed: true },
          },
        },
      });

      await tx.activityLog.create({
        data: {
          userId: actorId,
          projectId: updated.projectId,
          action: 'task.moved',
          entityType: 'task',
          entityId: id,
          metadata: {
            taskNumber: updated.number,
            status: dto.status,
            position: dto.position,
          },
        },
      });

      return updated;
    });

    this.eventBus.publish({
      event: RealtimeEvents.TASK_MOVED,
      projectId: result.projectId,
      actorId,
      entityId: result.id,
      version: result.version,
      timestamp: new Date().toISOString(),
      data: result,
    });

    return result;
  }

  async deleteTask(id: string, actorId: string) {
    const task = await this.prisma.task.findUnique({
      where: { id },
      select: { id: true, projectId: true, number: true, deletedAt: true },
    });

    if (!task || task.deletedAt) {
      throw new NotFoundException({
        code: ErrorCode.NOT_FOUND,
        message: 'Task not found',
      });
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.task.update({
        where: { id },
        data: {
          deletedAt: new Date(),
          version: { increment: 1 },
        },
      });

      await tx.activityLog.create({
        data: {
          userId: actorId,
          projectId: task.projectId,
          action: 'task.deleted',
          entityType: 'task',
          entityId: id,
          metadata: { taskNumber: task.number },
        },
      });
    });

    this.eventBus.publish({
      event: RealtimeEvents.TASK_DELETED,
      projectId: task.projectId,
      actorId,
      entityId: id,
      timestamp: new Date().toISOString(),
      data: { id, projectId: task.projectId },
    });

    return { message: 'Task deleted successfully' };
  }
}
