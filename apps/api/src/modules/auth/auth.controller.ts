import {
  Controller,
  Post,
  Get,
  Patch,
  Body,
  Req,
  Res,
  UseGuards,
  UsePipes,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Request, Response } from 'express';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { CsrfOriginGuard } from './guards/csrf-origin.guard';
import { Public } from './decorators/public.decorator';
import { CurrentUser, AuthenticatedUser } from './decorators/current-user.decorator';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import {
  LoginSchema,
  LoginInput,
  ChangePasswordSchema,
  ChangePasswordInput,
  UpdateProfileSchema,
  UpdateProfileInput,
} from '@forgeline/shared';

@ApiTags('Auth')
@Controller('auth')
@UseGuards(CsrfOriginGuard)
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 5, ttl: 60000 } }) // Stricter rate-limiting on login (5 attempts per min)
  @ApiOperation({ summary: 'Login with email and password' })
  @ApiResponse({ status: 200, description: 'Authentication successful, sets httpOnly cookies' })
  @ApiResponse({ status: 401, description: 'Invalid email or password' })
  @ApiResponse({ status: 403, description: 'Account deactivated' })
  @ApiResponse({ status: 422, description: 'Validation error' })
  @UsePipes(new ZodValidationPipe(LoginSchema))
  async login(
    @Body() dto: LoginInput,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const userAgent = req.headers['user-agent'];
    const ip = req.ip || req.socket.remoteAddress;

    const result = await this.authService.login(dto, userAgent, ip);

    // Set httpOnly SameSite=Lax cookies
    res.cookie('access_token', result.accessToken, this.authService.getAccessTokenCookieOptions());
    res.cookie('refresh_token', result.refreshToken, this.authService.getRefreshTokenCookieOptions());

    return {
      user: result.user,
      message: 'Logged in successfully',
    };
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Rotate refresh token and issue new access token' })
  @ApiResponse({ status: 200, description: 'Token refreshed successfully' })
  @ApiResponse({ status: 401, description: 'Invalid or revoked token' })
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const rawRefreshToken = req.cookies?.['refresh_token'];
    const userAgent = req.headers['user-agent'];
    const ip = req.ip || req.socket.remoteAddress;

    const result = await this.authService.refresh(rawRefreshToken, userAgent, ip);

    res.cookie('access_token', result.accessToken, this.authService.getAccessTokenCookieOptions());
    res.cookie('refresh_token', result.refreshToken, this.authService.getRefreshTokenCookieOptions());

    return {
      user: result.user,
      message: 'Token rotated successfully',
    };
  }

  @Public()
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Logout and revoke refresh token' })
  @ApiResponse({ status: 200, description: 'Logged out successfully' })
  async logout(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const rawRefreshToken = req.cookies?.['refresh_token'];
    await this.authService.logout(rawRefreshToken);

    // Clear cookies
    res.clearCookie('access_token', { path: '/' });
    res.clearCookie('refresh_token', { path: '/' });

    return { message: 'Logged out successfully' };
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get profile of authenticated user' })
  @ApiResponse({ status: 200, description: 'Authenticated user profile' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  getMe(@CurrentUser() user: AuthenticatedUser) {
    return {
      user,
    };
  }

  @Patch('me')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Update profile details (name, handle)' })
  @ApiResponse({ status: 200, description: 'Profile updated' })
  @ApiResponse({ status: 409, description: 'Handle already taken' })
  @ApiResponse({ status: 422, description: 'Validation failed' })
  @UsePipes(new ZodValidationPipe(UpdateProfileSchema))
  async updateMe(
    @CurrentUser('id') userId: string,
    @Body() dto: UpdateProfileInput,
  ) {
    const updated = await this.authService.updateProfile(userId, dto);
    return {
      user: updated,
      message: 'Profile updated successfully',
    };
  }

  @Post('change-password')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Change password and invalidate other sessions' })
  @ApiResponse({ status: 200, description: 'Password changed successfully' })
  @ApiResponse({ status: 400, description: 'Current password invalid' })
  @UsePipes(new ZodValidationPipe(ChangePasswordSchema))
  async changePassword(
    @CurrentUser('id') userId: string,
    @Body() dto: ChangePasswordInput,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const userAgent = req.headers['user-agent'];
    const ip = req.ip || req.socket.remoteAddress;

    const result = await this.authService.changePassword(userId, dto, userAgent, ip);

    res.cookie('access_token', result.accessToken, this.authService.getAccessTokenCookieOptions());
    res.cookie('refresh_token', result.refreshToken, this.authService.getRefreshTokenCookieOptions());

    return {
      message: result.message,
    };
  }
}
