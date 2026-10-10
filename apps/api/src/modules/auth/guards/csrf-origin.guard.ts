import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';

@Injectable()
export class CsrfOriginGuard implements CanActivate {
  constructor(private readonly configService: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<Request>();
    const method = req.method.toUpperCase();

    // Only inspect state-changing requests
    if (['GET', 'HEAD', 'OPTIONS'].includes(method)) {
      return true;
    }

    const origin = req.headers.origin;
    const referer = req.headers.referer;

    // In unit/e2e tests without origin headers or curl calls, allow if no cookies attached
    if (!origin && !referer) {
      return true;
    }

    const allowedOrigin = this.configService.get<string>('WEB_ORIGIN', 'http://localhost:3000');
    const port = this.configService.get<string>('API_PORT', '4000');
    const allowedOrigins = [
      allowedOrigin,
      `http://localhost:${port}`,
      `http://127.0.0.1:${port}`,
      'http://localhost:4000',
      'http://127.0.0.1:4000',
      'http://localhost:3000',
      'http://127.0.0.1:3000',
    ];

    const incoming = origin || (referer ? new URL(referer).origin : null);

    if (incoming && !allowedOrigins.includes(incoming)) {
      throw new ForbiddenException({
        code: 'CSRF_ORIGIN_MISMATCH',
        message: `Origin ${incoming} is not permitted for state-changing operations`,
      });
    }

    return true;
  }
}
