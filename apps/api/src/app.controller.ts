import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Public } from './modules/auth/decorators/public.decorator';

@ApiTags('Root')
@Public()
@Controller()
export class AppController {
  @Get()
  @ApiOperation({ summary: 'API root operational status' })
  @ApiResponse({ status: 200, description: 'Forgeline API is operational' })
  getRoot() {
    return {
      status: 'ok',
      service: 'forgeline-api',
      version: '1.0.0',
      message: 'Forgeline High-Concurrency Operations API is online and operational',
      documentation: '/api/docs',
      health: '/api/v1/health',
      timestamp: new Date().toISOString(),
    };
  }
}
