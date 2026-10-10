import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  Headers,
  UsePipes,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiHeader } from '@nestjs/swagger';
import { TasksService } from './tasks.service';
import { RequirePermission } from '../../common/policy/require-permission.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import {
  Permissions,
  CreateTaskSchema,
  CreateTaskInput,
  UpdateTaskSchema,
  UpdateTaskInput,
  AssignTaskSchema,
  AssignTaskInput,
  ChangeTaskStatusSchema,
  ChangeTaskStatusInput,
  MoveTaskSchema,
  MoveTaskInput,
  TaskStatus,
  TaskPriority,
} from '@forgeline/shared';

@ApiTags('Tasks')
@Controller()
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Get('projects/:projectId/tasks')
  @RequirePermission(Permissions.PROJECT_VIEW)
  @ApiOperation({ summary: 'List and filter tasks for a project with cursor pagination' })
  @ApiResponse({ status: 200, description: 'List of tasks' })
  async listTasks(
    @Param('projectId') projectId: string,
    @Query('status') status?: TaskStatus,
    @Query('priority') priority?: TaskPriority,
    @Query('assigneeId') assigneeId?: string,
    @Query('search') search?: string,
    @Query('cursor') cursor?: string,
    @Query('limit') limitStr?: string,
  ) {
    const limit = limitStr ? parseInt(limitStr, 10) : undefined;
    return this.tasksService.listTasks(projectId, {
      status,
      priority,
      assigneeId,
      search,
      cursor,
      limit,
    });
  }

  @Post('projects/:projectId/tasks')
  @RequirePermission(Permissions.TASK_CREATE)
  @ApiOperation({ summary: 'Create a new task with race-safe contiguous number (PM or Admin)' })
  @ApiResponse({ status: 201, description: 'Task created' })
  @ApiResponse({ status: 403, description: 'Forbidden (Team Member cannot create)' })
  @UsePipes(new ZodValidationPipe(CreateTaskSchema))
  async createTask(
    @Param('projectId') projectId: string,
    @Body() dto: CreateTaskInput,
    @CurrentUser('id') actorId: string,
  ) {
    return this.tasksService.createTask(projectId, dto, actorId);
  }

  @Get('tasks/mine')
  @ApiOperation({ summary: 'Get tasks assigned to the current user' })
  @ApiResponse({ status: 200, description: 'List of assigned tasks' })
  async getMyTasks(@CurrentUser('id') userId: string) {
    return this.tasksService.getMyTasks(userId);
  }

  @Get('tasks/:id')
  @RequirePermission(Permissions.PROJECT_VIEW)
  @ApiOperation({ summary: 'Get task details by ID' })
  @ApiResponse({ status: 200, description: 'Task details' })
  @ApiResponse({ status: 404, description: 'Task not found or non-member access' })
  async getTask(@Param('id') id: string) {
    return this.tasksService.getTask(id);
  }

  @Patch('tasks/:id')
  @RequirePermission(Permissions.TASK_UPDATE)
  @ApiOperation({ summary: 'Update task fields with optimistic concurrency' })
  @ApiHeader({ name: 'if-match', required: false, description: 'Version number for concurrency' })
  @ApiResponse({ status: 200, description: 'Task updated' })
  @ApiResponse({ status: 403, description: 'Forbidden if unassigned Team Member' })
  @ApiResponse({ status: 409, description: 'Version conflict' })
  @UsePipes(new ZodValidationPipe(UpdateTaskSchema))
  async updateTask(
    @Param('id') id: string,
    @Body() dto: UpdateTaskInput,
    @CurrentUser('id') actorId: string,
    @Headers('if-match') ifMatch?: string,
  ) {
    return this.tasksService.updateTask(id, dto, actorId, ifMatch);
  }

  @Post('tasks/:id/assign')
  @HttpCode(HttpStatus.OK)
  @RequirePermission(Permissions.TASK_ASSIGN)
  @ApiOperation({ summary: 'Assign task to a team member (PM or Admin)' })
  @ApiHeader({ name: 'if-match', required: false })
  @ApiResponse({ status: 200, description: 'Task assigned' })
  @ApiResponse({ status: 403, description: 'Forbidden for Team Members' })
  @ApiResponse({ status: 409, description: 'Version conflict' })
  @UsePipes(new ZodValidationPipe(AssignTaskSchema))
  async assignTask(
    @Param('id') id: string,
    @Body() dto: AssignTaskInput,
    @CurrentUser('id') actorId: string,
    @Headers('if-match') ifMatch?: string,
  ) {
    return this.tasksService.assignTask(id, dto, actorId, ifMatch);
  }

  @Post('tasks/:id/status')
  @HttpCode(HttpStatus.OK)
  @RequirePermission(Permissions.TASK_STATUS_CHANGE)
  @ApiOperation({ summary: 'Transition task workflow status' })
  @ApiHeader({ name: 'if-match', required: false })
  @ApiResponse({ status: 200, description: 'Status updated' })
  @ApiResponse({ status: 409, description: 'Version conflict' })
  @UsePipes(new ZodValidationPipe(ChangeTaskStatusSchema))
  async changeTaskStatus(
    @Param('id') id: string,
    @Body() dto: ChangeTaskStatusInput,
    @CurrentUser('id') actorId: string,
    @Headers('if-match') ifMatch?: string,
  ) {
    return this.tasksService.changeTaskStatus(id, dto, actorId, ifMatch);
  }

  @Post('tasks/:id/move')
  @HttpCode(HttpStatus.OK)
  @RequirePermission(Permissions.TASK_UPDATE)
  @ApiOperation({ summary: 'Move task between columns or adjust board position' })
  @ApiHeader({ name: 'if-match', required: false })
  @ApiResponse({ status: 200, description: 'Task moved' })
  @ApiResponse({ status: 409, description: 'Version conflict' })
  @UsePipes(new ZodValidationPipe(MoveTaskSchema))
  async moveTask(
    @Param('id') id: string,
    @Body() dto: MoveTaskInput,
    @CurrentUser('id') actorId: string,
    @Headers('if-match') ifMatch?: string,
  ) {
    return this.tasksService.moveTask(id, dto, actorId, ifMatch);
  }

  @Delete('tasks/:id')
  @HttpCode(HttpStatus.OK)
  @RequirePermission(Permissions.TASK_DELETE)
  @ApiOperation({ summary: 'Soft-delete task (PM or Admin)' })
  @ApiResponse({ status: 200, description: 'Task deleted' })
  @ApiResponse({ status: 403, description: 'Forbidden for Team Members' })
  async deleteTask(
    @Param('id') id: string,
    @CurrentUser('id') actorId: string,
  ) {
    return this.tasksService.deleteTask(id, actorId);
  }
}
