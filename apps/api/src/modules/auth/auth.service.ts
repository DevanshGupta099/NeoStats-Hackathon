import {
  Injectable,
  UnauthorizedException,
  ForbiddenException,
  BadRequestException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../common/prisma/prisma.service';
import { LoginInput, ChangePasswordInput, UpdateProfileInput } from '@forgeline/shared';
import * as argon2 from 'argon2';
import * as crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';
import { CookieOptions } from 'express';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Login user with lockout-safe error messages and Argon2id verification.
   */
  async login(dto: LoginInput, userAgent?: string, ip?: string) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase().trim() },
    });

    // Lockout-safe timing protection: verify dummy hash if user does not exist
    if (!user) {
      try {
        await argon2.verify('$argon2id$v=19$m=65536,t=3,p=4$dGVzdHNhbHQxMjM0NQ$dGVzdGhhc2gxMjM0NQ', dto.password);
      } catch {
        // Timing mitigation
      }
      throw new UnauthorizedException({
        code: 'INVALID_CREDENTIALS',
        message: 'Invalid email or password',
      });
    }

    const passwordValid = await argon2.verify(user.passwordHash, dto.password);
    if (!passwordValid) {
      throw new UnauthorizedException({
        code: 'INVALID_CREDENTIALS',
        message: 'Invalid email or password',
      });
    }

    if (!user.isActive) {
      throw new ForbiddenException({
        code: 'ACCOUNT_DEACTIVATED',
        message: 'Account has been deactivated. Please contact an administrator.',
      });
    }

    // Update last login timestamp
    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    const familyId = uuidv4();
    const accessToken = await this.generateAccessToken(user);
    const refreshToken = await this.createRefreshToken(user.id, familyId, userAgent, ip);

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { passwordHash, ...sanitizedUser } = user;

    return {
      user: sanitizedUser,
      accessToken,
      refreshToken,
    };
  }

  /**
   * Rotate refresh token and detect reuse across family sessions.
   */
  async refresh(rawRefreshToken: string, userAgent?: string, ip?: string) {
    if (!rawRefreshToken) {
      throw new UnauthorizedException({
        code: 'REFRESH_TOKEN_REQUIRED',
        message: 'Refresh token cookie is required',
      });
    }

    const tokenHash = this.hashToken(rawRefreshToken);

    const tokenRecord = await this.prisma.refreshToken.findFirst({
      where: { tokenHash },
      include: { user: true },
    });

    if (!tokenRecord) {
      throw new UnauthorizedException({
        code: 'INVALID_REFRESH_TOKEN',
        message: 'Invalid or expired refresh token',
      });
    }

    // REUSE DETECTION: If this token was already revoked, a malicious reuse is happening!
    if (tokenRecord.revokedAt !== null) {
      this.logger.warn(
        `[SECURITY] Refresh token reuse detected for user ${tokenRecord.userId} in family ${tokenRecord.familyId}. Revoking entire family.`,
      );

      // Revoke all tokens in this family
      await this.prisma.refreshToken.updateMany({
        where: { familyId: tokenRecord.familyId },
        data: { revokedAt: new Date() },
      });

      // Invalidate current active access tokens by incrementing user's tokenVersion
      await this.prisma.user.update({
        where: { id: tokenRecord.userId },
        data: { tokenVersion: { increment: 1 } },
      });

      throw new UnauthorizedException({
        code: 'REFRESH_TOKEN_REUSE_DETECTED',
        message: 'Security violation: Refresh token reuse detected. All sessions in this family have been revoked.',
      });
    }

    // Check expiration
    if (tokenRecord.expiresAt < new Date()) {
      throw new UnauthorizedException({
        code: 'EXPIRED_REFRESH_TOKEN',
        message: 'Refresh token has expired',
      });
    }

    // Check if user has been deactivated
    if (!tokenRecord.user.isActive) {
      throw new ForbiddenException({
        code: 'ACCOUNT_DEACTIVATED',
        message: 'Account has been deactivated. Please contact an administrator.',
      });
    }

    // Revoke current token as part of rotation
    await this.prisma.refreshToken.update({
      where: { id: tokenRecord.id },
      data: { revokedAt: new Date() },
    });

    // Issue new token in the SAME family
    const newRefreshToken = await this.createRefreshToken(
      tokenRecord.userId,
      tokenRecord.familyId,
      userAgent,
      ip,
    );
    const newAccessToken = await this.generateAccessToken(tokenRecord.user);

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { passwordHash, ...sanitizedUser } = tokenRecord.user;

    return {
      user: sanitizedUser,
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    };
  }

  /**
   * Log out: revoke current refresh token if provided.
   */
  async logout(rawRefreshToken?: string) {
    if (rawRefreshToken) {
      const tokenHash = this.hashToken(rawRefreshToken);
      await this.prisma.refreshToken.updateMany({
        where: { tokenHash },
        data: { revokedAt: new Date() },
      });
    }

    return { message: 'Logged out successfully' };
  }

  /**
   * Change password: verifies old, sets new, revokes all other sessions.
   */
  async changePassword(userId: string, dto: ChangePasswordInput, userAgent?: string, ip?: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new UnauthorizedException({
        code: 'USER_NOT_FOUND',
        message: 'User does not exist',
      });
    }

    const currentValid = await argon2.verify(user.passwordHash, dto.currentPassword);
    if (!currentValid) {
      throw new BadRequestException({
        code: 'INVALID_CURRENT_PASSWORD',
        message: 'Current password provided is incorrect',
      });
    }

    const newPasswordHash = await argon2.hash(dto.newPassword, {
      type: argon2.argon2id,
    });

    // Invalidate all tokens and bump tokenVersion
    const updatedUser = await this.prisma.$transaction(async (tx) => {
      // Revoke all previous refresh tokens
      await tx.refreshToken.updateMany({
        where: { userId },
        data: { revokedAt: new Date() },
      });

      return tx.user.update({
        where: { id: userId },
        data: {
          passwordHash: newPasswordHash,
          tokenVersion: { increment: 1 },
        },
      });
    });

    // Issue fresh tokens for the current session
    const familyId = uuidv4();
    const accessToken = await this.generateAccessToken(updatedUser);
    const refreshToken = await this.createRefreshToken(updatedUser.id, familyId, userAgent, ip);

    return {
      message: 'Password changed successfully',
      accessToken,
      refreshToken,
    };
  }

  /**
   * Update profile (name, handle).
   */
  async updateProfile(userId: string, dto: UpdateProfileInput) {
    if (dto.handle) {
      const existingHandle = await this.prisma.user.findFirst({
        where: {
          handle: dto.handle,
          NOT: { id: userId },
        },
      });

      if (existingHandle) {
        throw new ConflictException({
          code: 'HANDLE_ALREADY_EXISTS',
          message: `Handle @${dto.handle} is already taken by another user`,
        });
      }
    }

    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: {
        ...(dto.name ? { name: dto.name } : {}),
        ...(dto.handle ? { handle: dto.handle } : {}),
      },
    });

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { passwordHash, ...sanitized } = updated;
    return sanitized;
  }

  // --- Internal Token Helpers ---

  private async generateAccessToken(user: { id: string; email: string; globalRole: string; tokenVersion: number }): Promise<string> {
    const secret = this.configService.get<string>('JWT_ACCESS_SECRET', 'forgeline_dev_jwt_access_secret_min_32_chars_long');
    const expiresIn = this.configService.get<string>('ACCESS_TOKEN_TTL', '15m');

    return this.jwtService.signAsync(
      {
        sub: user.id,
        email: user.email,
        globalRole: user.globalRole,
        tokenVersion: user.tokenVersion,
      },
      {
        secret,
        expiresIn: (expiresIn as any),
      },
    );
  }

  private async createRefreshToken(
    userId: string,
    familyId: string,
    userAgent?: string,
    ip?: string,
  ): Promise<string> {
    const rawToken = crypto.randomBytes(40).toString('hex');
    const tokenHash = this.hashToken(rawToken);
    const expiresDays = 7;
    const expiresAt = new Date(Date.now() + expiresDays * 24 * 60 * 60 * 1000);

    await this.prisma.refreshToken.create({
      data: {
        userId,
        tokenHash,
        familyId,
        expiresAt,
        userAgent: userAgent ? userAgent.substring(0, 255) : null,
        ip: ip ? ip.substring(0, 45) : null,
      },
    });

    return rawToken;
  }

  private hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  getAccessTokenCookieOptions(): CookieOptions {
    const isSecure = this.configService.get<string>('COOKIE_SECURE') === 'true';
    return {
      httpOnly: true,
      sameSite: 'lax',
      secure: isSecure,
      path: '/',
      maxAge: 15 * 60 * 1000, // 15 mins
    };
  }

  getRefreshTokenCookieOptions(): CookieOptions {
    const isSecure = this.configService.get<string>('COOKIE_SECURE') === 'true';
    return {
      httpOnly: true,
      sameSite: 'lax',
      secure: isSecure,
      path: '/',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    };
  }
}
