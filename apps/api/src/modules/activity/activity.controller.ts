import {
  Controller,
  Get,
  Param,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { ActivityService } from './activity.service';
import { RequirePermission } from '../../common/policy/require-permission.decorator';
import { Permissions } from '@forgeline/shared';

@ApiTags('Activity')
@ApiBearerAuth('bearer-jwt')
@Controller()
export class ActivityController {
  constructor(private readonly activityService: ActivityService) {}

  @Get('projects/:projectId/activity')
  @RequirePermission(Permissions.PROJECT_VIEW)
  @ApiOperation({ summary: 'List project activity timeline with cursor pagination' })
  @ApiQuery({ name: 'cursor', required: false, type: String })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'entityType', required: false, type: String })
  @ApiQuery({ name: 'action', required: false, type: String })
  @ApiResponse({ status: 200, description: 'Project activity logs' })
  async listProjectActivity(
    @Param('projectId') projectId: string,
    @Query('cursor') cursor?: string,
    @Query('limit') limitStr?: string,
    @Query('entityType') entityType?: string,
    @Query('action') action?: string,
  ) {
    const limit = limitStr ? parseInt(limitStr, 10) : undefined;
    return this.activityService.listProjectActivity(projectId, {
      cursor,
      limit,
      entityType,
      action,
    });
  }

  @Get('activity')
  @RequirePermission(Permissions.USER_MANAGE)
  @ApiOperation({ summary: 'System-wide audit trail (Admin only)' })
  @ApiQuery({ name: 'cursor', required: false, type: String })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'entityType', required: false, type: String })
  @ApiQuery({ name: 'action', required: false, type: String })
  @ApiResponse({ status: 200, description: 'All system activity logs' })
  async listSystemActivity(
    @Query('cursor') cursor?: string,
    @Query('limit') limitStr?: string,
    @Query('entityType') entityType?: string,
    @Query('action') action?: string,
  ) {
    const limit = limitStr ? parseInt(limitStr, 10) : undefined;
    return this.activityService.listSystemActivity({
      cursor,
      limit,
      entityType,
      action,
    });
  }
}
