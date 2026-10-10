import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../common/prisma/prisma.service';
import { DomainEventBus } from '../../common/events/domain-event-bus';
import { PresenceService } from './presence.service';
import {
  RealtimeEvents,
  ClientRealtimeEvents,
  RealtimeEnvelope,
  GlobalRole,
  PresenceUser,
} from '@forgeline/shared';
import { Subscription } from 'rxjs';

@WebSocketGateway({
  cors: {
    origin: true,
    credentials: true,
  },
  namespace: '/',
})
export class RealtimeGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server!: Server;

  private readonly logger = new Logger(RealtimeGateway.name);
  private eventSub?: Subscription;

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
    private readonly eventBus: DomainEventBus,
    private readonly presenceService: PresenceService,
  ) {}

  afterInit(server: Server) {
    this.logger.log('[RealtimeGateway] Initialized and listening for connections');

    // 1. Handshake authentication middleware
    server.use(async (socket: Socket, next) => {
      try {
        const token = this.extractToken(socket);
        if (!token) {
          return next(new Error('Authentication token required'));
        }

        const secret = this.configService.get<string>(
          'JWT_ACCESS_SECRET',
          'forgeline_dev_jwt_access_secret_min_32_chars_long',
        );
        const payload = await this.jwtService.verifyAsync(token, { secret });

        const user = await this.prisma.user.findUnique({
          where: { id: payload.sub },
          select: {
            id: true,
            email: true,
            name: true,
            handle: true,
            globalRole: true,
            isActive: true,
            tokenVersion: true,
          },
        });

        if (!user || !user.isActive || user.tokenVersion !== payload.tokenVersion) {
          return next(new Error('Account inactive or session invalidated'));
        }

        socket.data.user = user;
        next();
      } catch (err) {
        this.logger.warn(`[RealtimeGateway] Auth handshake failed for ${socket.id}: ${(err as Error).message}`);
        next(new Error('Authentication failed'));
      }
    });

    // 2. Subscribe to post-commit domain events
    this.eventSub = this.eventBus.stream$.subscribe((envelope: RealtimeEnvelope) => {
      this.routeDomainEvent(envelope);
    });
  }

  handleConnection(client: Socket) {
    const user = client.data?.user;
    if (user) {
      // Auto-join personal notification stream
      const personalRoom = `user:${user.id}`;
      client.join(personalRoom);
      this.logger.debug(`[RealtimeGateway] User ${user.email} (${client.id}) connected -> joined ${personalRoom}`);
    }
  }

  handleDisconnect(client: Socket) {
    const user = client.data?.user;
    if (user) {
      this.logger.debug(`[RealtimeGateway] User ${user.email} disconnected (${client.id})`);
      const affected = this.presenceService.removeUserFromAll(user.id);
      for (const [projectId, activeUsers] of affected.entries()) {
        this.server.to(`project:${projectId}`).emit(RealtimeEvents.PRESENCE_UPDATE, {
          projectId,
          activeUsers,
        });
      }
    }
  }

  @SubscribeMessage(ClientRealtimeEvents.PROJECT_JOIN)
  async handleProjectJoin(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { projectId: string },
  ) {
    const user = client.data?.user;
    if (!user || !payload?.projectId) {
      return { success: false, error: 'Unauthorized or invalid payload' };
    }

    const { projectId } = payload;

    // Check project authorization
    if (user.globalRole !== GlobalRole.ADMIN) {
      const membership = await this.prisma.projectMember.findUnique({
        where: {
          projectId_userId: { projectId, userId: user.id },
        },
      });

      if (!membership) {
        this.logger.warn(`[RealtimeGateway] Denied join to project:${projectId} for non-member ${user.email}`);
        return { success: false, error: 'Access denied: not a member of project' };
      }
    }

    const room = `project:${projectId}`;
    client.join(room);

    const presenceUser: PresenceUser = {
      userId: user.id,
      name: user.name,
      handle: user.handle,
      role: user.globalRole,
      lastSeen: new Date().toISOString(),
    };

    const activeUsers = this.presenceService.addUser(projectId, presenceUser);
    this.server.to(room).emit(RealtimeEvents.PRESENCE_UPDATE, {
      projectId,
      activeUsers,
    });

    this.logger.debug(`[RealtimeGateway] Socket ${client.id} joined ${room}`);
    return { success: true, projectId, activeUsers };
  }

  @SubscribeMessage(ClientRealtimeEvents.PROJECT_LEAVE)
  handleProjectLeave(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { projectId: string },
  ) {
    const user = client.data?.user;
    if (!user || !payload?.projectId) return;

    const { projectId } = payload;
    const room = `project:${projectId}`;
    client.leave(room);

    const activeUsers = this.presenceService.removeUser(projectId, user.id);
    this.server.to(room).emit(RealtimeEvents.PRESENCE_UPDATE, {
      projectId,
      activeUsers,
    });

    return { success: true };
  }

  @SubscribeMessage(ClientRealtimeEvents.PRESENCE_HEARTBEAT)
  handlePresenceHeartbeat(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { projectId: string },
  ) {
    const user = client.data?.user;
    if (!user || !payload?.projectId) return;

    this.presenceService.heartbeat(payload.projectId, user.id);
    return { success: true };
  }

  private routeDomainEvent(envelope: RealtimeEnvelope) {
    // 1. Account deactivation: force disconnect all sockets for this user
    if (envelope.event === RealtimeEvents.USER_DEACTIVATED) {
      const userId = envelope.entityId;
      const userRoom = `user:${userId}`;
      this.server.to(userRoom).emit(RealtimeEvents.USER_DEACTIVATED, envelope);
      this.server.in(userRoom).disconnectSockets(true);
      return;
    }

    // 2. Member removed: evict sockets from project room
    if (envelope.event === RealtimeEvents.MEMBER_REMOVED && envelope.projectId) {
      const targetUserId = (envelope.data as any)?.userId;
      const projectRoom = `project:${envelope.projectId}`;

      // Notify project room
      this.server.to(projectRoom).emit(RealtimeEvents.MEMBER_REMOVED, envelope);

      // Force target user's sockets to leave this project room
      if (targetUserId) {
        this.server.in(projectRoom).fetchSockets().then((sockets) => {
          for (const s of sockets) {
            if (s.data?.user?.id === targetUserId) {
              s.leave(projectRoom);
            }
          }
        });
      }
      return;
    }

    // 3. Notification events: route directly to recipient's personal room
    if (envelope.event === RealtimeEvents.NOTIFICATION_CREATED) {
      const recipientId = (envelope.data as any)?.userId;
      if (recipientId) {
        this.server.to(`user:${recipientId}`).emit(envelope.event, envelope);
      }
      return;
    }

    if (envelope.event === RealtimeEvents.NOTIFICATION_READ) {
      this.server.to(`user:${envelope.actorId}`).emit(envelope.event, envelope);
      return;
    }

    // 4. Project-scoped mutations (tasks, comments, roster, stats)
    if (envelope.projectId) {
      this.server.to(`project:${envelope.projectId}`).emit(envelope.event, envelope);
    }
  }

  private extractToken(client: Socket): string | null {
    // 1. From auth object
    if (client.handshake.auth?.token) {
      return client.handshake.auth.token;
    }

    // 2. From query parameter
    if (client.handshake.query?.token && typeof client.handshake.query.token === 'string') {
      return client.handshake.query.token;
    }

    // 3. From Authorization header
    const authHeader = client.handshake.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      return authHeader.substring(7).trim();
    }

    // 4. From Cookie header
    const cookieHeader = client.handshake.headers.cookie;
    if (cookieHeader) {
      const match = cookieHeader.match(/(?:^|;\s*)access_token=([^;]+)/);
      if (match) {
        return decodeURIComponent(match[1]);
      }
    }

    return null;
  }
}
