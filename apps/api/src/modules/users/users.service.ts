import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { DomainEventBus } from '../../common/events/domain-event-bus';
import {
  CreateUserInput,
  UpdateUserInput,
  GlobalRole,
  RealtimeEvents,
  ErrorCode,
} from '@forgeline/shared';
import * as argon2 from 'argon2';

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly eventBus: DomainEventBus,
  ) {}

  async listUsers(query: {
    search?: string;
    role?: GlobalRole;
    isActive?: boolean;
    cursor?: string;
    limit?: number;
  }) {
    const limit = query.limit ? Math.min(Math.max(query.limit, 1), 100) : 25;
    const where: Record<string, unknown> = {};

    if (query.role) {
      where.globalRole = query.role;
    }

    if (query.isActive !== undefined) {
      where.isActive = query.isActive;
    }

    if (query.search) {
      const search = query.search.trim();
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { handle: { contains: search, mode: 'insensitive' } },
      ];
    }

    const items = await this.prisma.user.findMany({
      where,
      take: limit + 1,
      cursor: query.cursor ? { id: query.cursor } : undefined,
      skip: query.cursor ? 1 : 0,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        email: true,
        name: true,
        handle: true,
        globalRole: true,
        isActive: true,
        avatarSeed: true,
        lastLoginAt: true,
        createdAt: true,
        updatedAt: true,
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

  async getUser(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        name: true,
        handle: true,
        globalRole: true,
        isActive: true,
        avatarSeed: true,
        lastLoginAt: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      throw new NotFoundException({
        code: ErrorCode.NOT_FOUND,
        message: 'User not found',
      });
    }

    return user;
  }

  async createUser(dto: CreateUserInput, actorId: string) {
    const existingEmail = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase().trim() },
    });
    if (existingEmail) {
      throw new ConflictException({
        code: ErrorCode.VALIDATION_ERROR,
        message: 'A user with this email already exists',
      });
    }

    const existingHandle = await this.prisma.user.findUnique({
      where: { handle: dto.handle.trim() },
    });
    if (existingHandle) {
      throw new ConflictException({
        code: ErrorCode.VALIDATION_ERROR,
        message: 'Handle is already taken',
      });
    }

    const passwordHash = await argon2.hash(dto.password, {
      type: argon2.argon2id,
      memoryCost: 65536,
      timeCost: 3,
      parallelism: 4,
    });

    return this.prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email: dto.email.toLowerCase().trim(),
          name: dto.name.trim(),
          handle: dto.handle.trim(),
          passwordHash,
          globalRole: dto.globalRole || GlobalRole.TEAM_MEMBER,
          avatarSeed: dto.handle.trim(),
        },
        select: {
          id: true,
          email: true,
          name: true,
          handle: true,
          globalRole: true,
          isActive: true,
          avatarSeed: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      await tx.activityLog.create({
        data: {
          userId: actorId,
          action: 'user.created',
          entityType: 'user',
          entityId: user.id,
          metadata: { email: user.email, globalRole: user.globalRole },
        },
      });

      return user;
    });
  }

  async updateUser(id: string, dto: UpdateUserInput, actorId: string) {
    const existing = await this.getUser(id);

    if (dto.handle && dto.handle !== existing.handle) {
      const conflict = await this.prisma.user.findUnique({
        where: { handle: dto.handle },
      });
      if (conflict) {
        throw new ConflictException({
          code: ErrorCode.VALIDATION_ERROR,
          message: 'Handle is already taken',
        });
      }
    }

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.user.update({
        where: { id },
        data: {
          name: dto.name,
          handle: dto.handle,
          globalRole: dto.globalRole,
          isActive: dto.isActive,
        },
        select: {
          id: true,
          email: true,
          name: true,
          handle: true,
          globalRole: true,
          isActive: true,
          avatarSeed: true,
          updatedAt: true,
        },
      });

      await tx.activityLog.create({
        data: {
          userId: actorId,
          action: 'user.updated',
          entityType: 'user',
          entityId: id,
          metadata: { before: existing, after: updated },
        },
      });

      return updated;
    });
  }

  async deactivateUser(id: string, actorId: string) {
    if (id === actorId) {
      throw new BadRequestException({
        code: ErrorCode.VALIDATION_ERROR,
        message: 'Administrators cannot deactivate their own account',
      });
    }

    const user = await this.getUser(id);
    if (!user.isActive) {
      return { message: 'User is already deactivated', user };
    }

    const result = await this.prisma.$transaction(async (tx) => {
      const updated = await tx.user.update({
        where: { id },
        data: {
          isActive: false,
          tokenVersion: { increment: 1 },
        },
        select: {
          id: true,
          email: true,
          name: true,
          handle: true,
          globalRole: true,
          isActive: true,
          updatedAt: true,
        },
      });

      // Revoke all existing refresh tokens
      await tx.refreshToken.updateMany({
        where: { userId: id, revokedAt: null },
        data: { revokedAt: new Date() },
      });

      // Log deactivation
      await tx.activityLog.create({
        data: {
          userId: actorId,
          action: 'user.deactivated',
          entityType: 'user',
          entityId: id,
          metadata: { reason: 'Admin deactivation' },
        },
      });

      return updated;
    });

    // Emit realtime event post-commit
    this.eventBus.publish({
      event: RealtimeEvents.USER_DEACTIVATED,
      actorId,
      entityId: id,
      timestamp: new Date().toISOString(),
      data: { userId: id },
    });

    return { message: 'User deactivated successfully', user: result };
  }

  async reactivateUser(id: string, actorId: string) {
    await this.getUser(id);

    const result = await this.prisma.$transaction(async (tx) => {
      const updated = await tx.user.update({
        where: { id },
        data: { isActive: true },
        select: {
          id: true,
          email: true,
          name: true,
          handle: true,
          globalRole: true,
          isActive: true,
          updatedAt: true,
        },
      });

      await tx.activityLog.create({
        data: {
          userId: actorId,
          action: 'user.reactivated',
          entityType: 'user',
          entityId: id,
          metadata: {},
        },
      });

      return updated;
    });

    return { message: 'User reactivated successfully', user: result };
  }
}
