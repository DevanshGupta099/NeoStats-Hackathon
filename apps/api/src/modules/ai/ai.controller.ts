import {
  Controller,
  Post,
  Param,
  Body,
  Res,
  UsePipes,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Response } from 'express';
import { AiService } from './ai.service';
import { RequirePermission } from '../../common/policy/require-permission.decorator';
import { CurrentUser, AuthenticatedUser } from '../auth/decorators/current-user.decorator';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import {
  Permissions,
  TaskDraftRequestSchema,
  TaskDraftRequestInput,
  AiTaskDraftEnvelope,
} from '@forgeline/shared';

@ApiTags('AI')
@Controller()
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Post('projects/:id/ai/digest')
  @RequirePermission(Permissions.PROJECT_VIEW)
  @ApiOperation({ summary: 'Stream an executive project standup digest via SSE' })
  @ApiResponse({ status: 200, description: 'Server-Sent Events text stream' })
  @ApiResponse({ status: 403, description: 'Forbidden - User does not have access to this project' })
  @ApiResponse({ status: 404, description: 'Project not found' })
  async getProjectDigest(
    @Param('id') projectId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Res() res: Response,
  ): Promise<void> {
    await this.aiService.generateProjectDigest(projectId, user, res);
  }

  @Post('ai/task-draft')
  @UsePipes(new ZodValidationPipe(TaskDraftRequestSchema))
  @ApiOperation({ summary: 'Generate a structured task payload draft from prompt' })
  @ApiResponse({ status: 200, description: 'Validated structured task draft' })
  async draftTask(
    @Body() dto: TaskDraftRequestInput,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<AiTaskDraftEnvelope> {
    return this.aiService.generateTaskDraft(dto, user);
  }
}
