import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { DomainEventBus } from '../../common/events/domain-event-bus';
import {
  CreateCommentInput,
  RealtimeEvents,
  ErrorCode,
} from '@forgeline/shared';

@Injectable()
export class CommentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly eventBus: DomainEventBus,
  ) {}

  async listComments(taskId: string) {
    const task = await this.prisma.task.findUnique({
      where: { id: taskId, deletedAt: null },
      select: { id: true },
    });

    if (!task) {
      throw new NotFoundException({
        code: ErrorCode.NOT_FOUND,
        message: 'Task not found',
      });
    }

    const comments = await this.prisma.comment.findMany({
      where: { taskId, deletedAt: null },
      orderBy: { createdAt: 'asc' },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            handle: true,
            email: true,
            avatarSeed: true,
          },
        },
      },
    });

    return comments;
  }

  async createComment(
    taskId: string,
    dto: CreateCommentInput,
    actorId: string,
  ) {
    const task = await this.prisma.task.findUnique({
      where: { id: taskId, deletedAt: null },
      include: {
        project: { select: { id: true, key: true, name: true } },
      },
    });

    if (!task) {
      throw new NotFoundException({
        code: ErrorCode.NOT_FOUND,
        message: 'Task not found',
      });
    }

    // Parse @handle mentions from comment body
    const mentionRegex = /@([a-zA-Z0-9_]+)/g;
    const handles = new Set<string>();
    let match: RegExpExecArray | null;
    while ((match = mentionRegex.exec(dto.body)) !== null) {
      handles.add(match[1]);
    }

    const mentionedUsers = handles.size > 0
      ? await this.prisma.user.findMany({
          where: {
            handle: { in: Array.from(handles) },
            isActive: true,
            projectMembers: {
              some: { projectId: task.projectId },
            },
          },
          select: { id: true, handle: true },
        })
      : [];

    const mentionedUserIds = mentionedUsers
      .map((u) => u.id)
      .filter((uid) => uid !== actorId);

    const result = await this.prisma.$transaction(async (tx) => {
      const comment = await tx.comment.create({
        data: {
          taskId,
          projectId: task.projectId,
          authorId: actorId,
          body: dto.body.trim(),
          mentions: mentionedUserIds,
        },
        include: {
          author: {
            select: {
              id: true,
              name: true,
              handle: true,
              avatarSeed: true,
            },
          },
        },
      });

      // Activity log
      await tx.activityLog.create({
        data: {
          userId: actorId,
          projectId: task.projectId,
          action: 'comment.created',
          entityType: 'comment',
          entityId: comment.id,
          metadata: {
            taskId,
            taskNumber: task.number,
            mentionsCount: mentionedUserIds.length,
          },
        },
      });

      // 1. Notify mentioned users
      for (const mentionedId of mentionedUserIds) {
        await tx.notification.create({
          data: {
            userId: mentionedId,
            actorId,
            projectId: task.projectId,
            type: 'mention',
            entityType: 'comment',
            entityId: comment.id,
            payload: {
              taskNumber: task.number,
              taskTitle: task.title,
              projectKey: task.project.key,
              commentSnippet: dto.body.slice(0, 80),
            },
          },
        });
      }

      // 2. Notify task assignee and reporter (if not actor and not already mentioned)
      const otherRecipients = new Set<string>();
      if (task.assigneeId && task.assigneeId !== actorId && !mentionedUserIds.includes(task.assigneeId)) {
        otherRecipients.add(task.assigneeId);
      }
      if (task.reporterId && task.reporterId !== actorId && !mentionedUserIds.includes(task.reporterId)) {
        otherRecipients.add(task.reporterId);
      }

      for (const recipientId of otherRecipients) {
        await tx.notification.create({
          data: {
            userId: recipientId,
            actorId,
            projectId: task.projectId,
            type: 'comment.created',
            entityType: 'comment',
            entityId: comment.id,
            payload: {
              taskNumber: task.number,
              taskTitle: task.title,
              projectKey: task.project.key,
              commentSnippet: dto.body.slice(0, 80),
            },
          },
        });
      }

      return comment;
    });

    this.eventBus.publish({
      event: RealtimeEvents.COMMENT_CREATED,
      projectId: task.projectId,
      actorId,
      entityId: result.id,
      timestamp: new Date().toISOString(),
      data: result,
    });

    return result;
  }

  async deleteComment(id: string, actorId: string) {
    const comment = await this.prisma.comment.findUnique({
      where: { id },
      select: { id: true, projectId: true, taskId: true, deletedAt: true },
    });

    if (!comment || comment.deletedAt) {
      throw new NotFoundException({
        code: ErrorCode.NOT_FOUND,
        message: 'Comment not found',
      });
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.comment.update({
        where: { id },
        data: { deletedAt: new Date() },
      });

      await tx.activityLog.create({
        data: {
          userId: actorId,
          projectId: comment.projectId,
          action: 'comment.deleted',
          entityType: 'comment',
          entityId: id,
          metadata: { taskId: comment.taskId },
        },
      });
    });

    this.eventBus.publish({
      event: RealtimeEvents.COMMENT_DELETED,
      projectId: comment.projectId,
      actorId,
      entityId: id,
      timestamp: new Date().toISOString(),
      data: { id, taskId: comment.taskId, projectId: comment.projectId },
    });

    return { message: 'Comment deleted successfully' };
  }
}
