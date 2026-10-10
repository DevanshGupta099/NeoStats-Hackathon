import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../../common/prisma/prisma.service';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { Request } from 'express';

export interface JwtPayload {
  sub: string;
  email: string;
  globalRole: string;
  tokenVersion: number;
  iat?: number;
  exp?: number;
}

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest<Request>();
    const token = this.extractTokenFromRequest(request);

    if (!token) {
      throw new UnauthorizedException({
        code: 'UNAUTHORIZED',
        message: 'Authentication token is required to access this resource',
      });
    }

    let payload: JwtPayload;
    try {
      const secret = this.configService.get<string>('JWT_ACCESS_SECRET', 'forgeline_dev_jwt_access_secret_min_32_chars_long');
      payload = await this.jwtService.verifyAsync<JwtPayload>(token, { secret });
    } catch {
      throw new UnauthorizedException({
        code: 'UNAUTHORIZED',
        message: 'Invalid or expired access token',
      });
    }

    // Load active user from database to verify active state and tokenVersion
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
    });

    if (!user) {
      throw new UnauthorizedException({
        code: 'UNAUTHORIZED',
        message: 'User associated with this token does not exist',
      });
    }

    if (!user.isActive) {
      throw new UnauthorizedException({
        code: 'UNAUTHORIZED',
        message: 'Account has been deactivated. Access revoked.',
      });
    }

    if (user.tokenVersion !== payload.tokenVersion) {
      throw new UnauthorizedException({
        code: 'UNAUTHORIZED',
        message: 'Session has been invalidated. Please log in again.',
      });
    }

    // Exclude passwordHash from user object attached to request
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { passwordHash, ...sanitizedUser } = user;
    (request as Request & { user: typeof sanitizedUser }).user = sanitizedUser;

    return true;
  }

  private extractTokenFromRequest(req: Request): string | null {
    // 1. Try reading from httpOnly cookie
    if (req.cookies && req.cookies['access_token']) {
      return req.cookies['access_token'];
    }

    // 2. Fallback to Authorization: Bearer header
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      return authHeader.substring(7).trim();
    }

    return null;
  }
}
