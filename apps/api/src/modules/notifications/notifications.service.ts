import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { DomainEventBus } from '../../common/events/domain-event-bus';
import { RealtimeEvents, ErrorCode } from '@forgeline/shared';

@Injectable()
export class NotificationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly eventBus: DomainEventBus,
  ) {}

  async listNotifications(
    userId: string,
    query: {
      unreadOnly?: boolean;
      cursor?: string;
      limit?: number;
    },
  ) {
    const limit = query.limit ? Math.min(Math.max(query.limit, 1), 100) : 25;
    const where: Record<string, unknown> = {
      userId,
    };

    if (query.unreadOnly) {
      where.readAt = null;
    }

    const items = await this.prisma.notification.findMany({
      where,
      take: limit + 1,
      cursor: query.cursor ? { id: query.cursor } : undefined,
      skip: query.cursor ? 1 : 0,
      orderBy: { createdAt: 'desc' },
      include: {
        actor: {
          select: {
            id: true,
            name: true,
            handle: true,
            avatarSeed: true,
          },
        },
      },
    });

    let nextCursor: string | null = null;
    if (items.length > limit) {
      const nextItem = items.pop();
      nextCursor = nextItem ? nextItem.id : null;
    }

    return {
      items,
      nextCursor,
    };
  }

  async getUnreadCount(userId: string) {
    const count = await this.prisma.notification.count({
      where: {
        userId,
        readAt: null,
      },
    });

    return { unreadCount: count };
  }

  async markAsRead(id: string, userId: string) {
    const notification = await this.prisma.notification.findFirst({
      where: { id, userId },
    });

    if (!notification) {
      throw new NotFoundException({
        code: ErrorCode.NOT_FOUND,
        message: 'Notification not found',
      });
    }

    const updated = await this.prisma.notification.update({
      where: { id },
      data: { readAt: new Date() },
    });

    this.eventBus.publish({
      event: RealtimeEvents.NOTIFICATION_READ,
      actorId: userId,
      entityId: id,
      timestamp: new Date().toISOString(),
      data: { id, readAt: updated.readAt },
    });

    return updated;
  }

  async markAllAsRead(userId: string) {
    const result = await this.prisma.notification.updateMany({
      where: {
        userId,
        readAt: null,
      },
      data: {
        readAt: new Date(),
      },
    });

    return {
      message: 'All notifications marked as read',
      count: result.count,
    };
  }
}
