import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  UsePipes,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiBody } from '@nestjs/swagger';
import { CommentsService } from './comments.service';
import { RequirePermission } from '../../common/policy/require-permission.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import {
  Permissions,
  CreateCommentSchema,
  CreateCommentInput,
} from '@forgeline/shared';

@ApiTags('Comments')
@ApiBearerAuth('bearer-jwt')
@Controller()
export class CommentsController {
  constructor(private readonly commentsService: CommentsService) {}

  @Get('tasks/:taskId/comments')
  @RequirePermission(Permissions.PROJECT_VIEW)
  @ApiOperation({ summary: 'List comments on a task' })
  @ApiResponse({ status: 200, description: 'List of comments' })
  async listComments(@Param('taskId') taskId: string) {
    return this.commentsService.listComments(taskId);
  }

  @Post('tasks/:taskId/comments')
  @RequirePermission(Permissions.COMMENT_CREATE)
  @ApiOperation({ summary: 'Add a comment to a task with @handle mention support' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['body'],
      properties: {
        body: { type: 'string', example: 'Ready for peer review @admin', description: 'Comment body with optional @handle mentions' },
        mentions: { type: 'array', items: { type: 'string' }, example: [], description: 'User IDs mentioned in comment' },
      },
    },
  })
  @ApiResponse({ status: 201, description: 'Comment created' })
  @UsePipes(new ZodValidationPipe(CreateCommentSchema))
  async createComment(
    @Param('taskId') taskId: string,
    @Body() dto: CreateCommentInput,
    @CurrentUser('id') actorId: string,
  ) {
    return this.commentsService.createComment(taskId, dto, actorId);
  }

  @Delete('comments/:id')
  @HttpCode(HttpStatus.OK)
  @RequirePermission(Permissions.COMMENT_DELETE)
  @ApiOperation({ summary: 'Delete comment (Author, PM, or Admin)' })
  @ApiResponse({ status: 200, description: 'Comment deleted' })
  @ApiResponse({ status: 403, description: 'Forbidden if deleting another users comment as member' })
  async deleteComment(
    @Param('id') id: string,
    @CurrentUser('id') actorId: string,
  ) {
    return this.commentsService.deleteComment(id, actorId);
  }
}
