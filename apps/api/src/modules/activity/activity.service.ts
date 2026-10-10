import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';

@Injectable()
export class ActivityService {
  constructor(private readonly prisma: PrismaService) {}

  async listProjectActivity(
    projectId: string,
    query: {
      cursor?: string;
      limit?: number;
      entityType?: string;
      action?: string;
    },
  ) {
    const limit = query.limit ? Math.min(Math.max(query.limit, 1), 100) : 25;
    const where: Record<string, unknown> = {
      projectId,
    };

    if (query.entityType) {
      where.entityType = query.entityType;
    }
    if (query.action) {
      where.action = query.action;
    }

    const items = await this.prisma.activityLog.findMany({
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
            email: true,
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

  async listSystemActivity(query: {
    cursor?: string;
    limit?: number;
    entityType?: string;
    action?: string;
  }) {
    const limit = query.limit ? Math.min(Math.max(query.limit, 1), 100) : 25;
    const where: Record<string, unknown> = {};

    if (query.entityType) {
      where.entityType = query.entityType;
    }
    if (query.action) {
      where.action = query.action;
    }

    const items = await this.prisma.activityLog.findMany({
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
            email: true,
            avatarSeed: true,
          },
        },
        project: {
          select: {
            id: true,
            key: true,
            name: true,
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
}
