import { Controller, Get, Res } from '@nestjs/common';
import type { Response } from 'express';

@Controller('health')
export class HealthController {
  @Get()
  getHealth() {
    return {
      status: 'ok',
      service: 'forgeline-api',
      version: '0.1.0',
      timestamp: new Date().toISOString(),
    };
  }

  @Get('probe-cors')
  probeCors(@Res({ passthrough: true }) res: Response) {
    // Set a verification probe cookie
    res.cookie('forgeline_probe', 'connected_ok', {
      httpOnly: true,
      sameSite: 'lax',
      secure: false,
      maxAge: 60 * 60 * 1000,
    });

    return {
      status: 'ok',
      cors: true,
      credentials: true,
      message: 'CORS and credential exchange verified between Next.js and NestJS',
      timestamp: new Date().toISOString(),
    };
  }
}
