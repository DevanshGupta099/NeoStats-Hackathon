import { Controller, Get, Res } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import type { Response } from 'express';
import { PrismaService } from '../common/prisma/prisma.service';

@ApiTags('Health')
@Controller('health')
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  @ApiOperation({ summary: 'API service liveness check' })
  @ApiResponse({ status: 200, description: 'Service is operational' })
  getHealth() {
    return {
      status: 'ok',
      service: 'forgeline-api',
      version: '0.1.0',
      timestamp: new Date().toISOString(),
    };
  }

  @Get('db')
  @ApiOperation({ summary: 'Database connectivity and latency check' })
  @ApiResponse({ status: 200, description: 'PostgreSQL database is connected and responsive' })
  async getDbHealth() {
    const start = Date.now();
    await this.prisma.$queryRaw`SELECT 1`;
    const latencyMs = Date.now() - start;

    return {
      status: 'ok',
      database: 'connected',
      latencyMs,
      timestamp: new Date().toISOString(),
    };
  }

  @Get('probe-cors')
  @ApiOperation({ summary: 'CORS and httpOnly cookie credentials verification probe' })
  probeCors(@Res({ passthrough: true }) res: Response) {
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
