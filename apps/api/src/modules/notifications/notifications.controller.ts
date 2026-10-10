import {
  Controller,
  Get,
  Post,
  Param,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { NotificationsService } from './notifications.service';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('Notifications')
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  @ApiOperation({ summary: 'List notifications for authenticated user' })
  @ApiResponse({ status: 200, description: 'Paginated user notifications' })
  async listNotifications(
    @CurrentUser('id') userId: string,
    @Query('unread') unreadStr?: string,
    @Query('cursor') cursor?: string,
    @Query('limit') limitStr?: string,
  ) {
    const unreadOnly = unreadStr === 'true';
    const limit = limitStr ? parseInt(limitStr, 10) : undefined;
    return this.notificationsService.listNotifications(userId, {
      unreadOnly,
      cursor,
      limit,
    });
  }

  @Get('unread-count')
  @ApiOperation({ summary: 'Get total unread notification count' })
  @ApiResponse({ status: 200, description: 'Unread notification count' })
  async getUnreadCount(@CurrentUser('id') userId: string) {
    return this.notificationsService.getUnreadCount(userId);
  }

  @Post(':id/read')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Mark single notification as read' })
  @ApiResponse({ status: 200, description: 'Notification updated' })
  async markAsRead(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.notificationsService.markAsRead(id, userId);
  }

  @Post('read-all')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Mark all unread notifications as read' })
  @ApiResponse({ status: 200, description: 'All notifications marked as read' })
  async markAllAsRead(@CurrentUser('id') userId: string) {
    return this.notificationsService.markAllAsRead(userId);
  }
}
