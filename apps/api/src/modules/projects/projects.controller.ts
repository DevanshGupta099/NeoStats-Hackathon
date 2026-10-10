import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Query,
  Headers,
  UsePipes,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiHeader } from '@nestjs/swagger';
import { ProjectsService } from './projects.service';
import { RequirePermission } from '../../common/policy/require-permission.decorator';
import { CurrentUser, AuthenticatedUser } from '../auth/decorators/current-user.decorator';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import {
  Permissions,
  CreateProjectSchema,
  CreateProjectInput,
  UpdateProjectSchema,
  UpdateProjectInput,
  ProjectStatus,
} from '@forgeline/shared';

@ApiTags('Projects')
@Controller('projects')
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Get()
  @ApiOperation({ summary: 'List projects (Admin sees all; users see member projects)' })
  @ApiResponse({ status: 200, description: 'List of projects' })
  async listProjects(
    @CurrentUser() user: AuthenticatedUser,
    @Query('status') status?: ProjectStatus,
    @Query('search') search?: string,
    @Query('mine') mineStr?: string,
  ) {
    const mine = mineStr === 'true';
    return this.projectsService.listProjects(user, { status, search, mine });
  }

  @Post()
  @RequirePermission(Permissions.PROJECT_CREATE)
  @ApiOperation({ summary: 'Create project (Admin only)' })
  @ApiResponse({ status: 201, description: 'Project created' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @UsePipes(new ZodValidationPipe(CreateProjectSchema))
  async createProject(
    @Body() dto: CreateProjectInput,
    @CurrentUser('id') actorId: string,
  ) {
    return this.projectsService.createProject(dto, actorId);
  }

  @Get(':id')
  @RequirePermission(Permissions.PROJECT_VIEW)
  @ApiOperation({ summary: 'Get project details (Members or Admin only)' })
  @ApiResponse({ status: 200, description: 'Project details' })
  @ApiResponse({ status: 404, description: 'Project not found (or non-member access)' })
  async getProject(@Param('id') id: string) {
    return this.projectsService.getProject(id);
  }

  @Patch(':id')
  @RequirePermission(Permissions.PROJECT_UPDATE)
  @ApiOperation({ summary: 'Update project with optimistic concurrency (Admin or PM only)' })
  @ApiHeader({ name: 'if-match', required: false, description: 'Entity version for concurrency' })
  @ApiResponse({ status: 200, description: 'Project updated' })
  @ApiResponse({ status: 409, description: 'Version conflict' })
  @UsePipes(new ZodValidationPipe(UpdateProjectSchema))
  async updateProject(
    @Param('id') id: string,
    @Body() dto: UpdateProjectInput,
    @CurrentUser('id') actorId: string,
    @Headers('if-match') ifMatch?: string,
  ) {
    return this.projectsService.updateProject(id, dto, actorId, ifMatch);
  }

  @Post(':id/archive')
  @HttpCode(HttpStatus.OK)
  @RequirePermission(Permissions.PROJECT_ARCHIVE)
  @ApiOperation({ summary: 'Archive project (Admin only)' })
  @ApiResponse({ status: 200, description: 'Project archived' })
  async archiveProject(
    @Param('id') id: string,
    @CurrentUser('id') actorId: string,
  ) {
    return this.projectsService.archiveProject(id, actorId);
  }

  @Post(':id/restore')
  @HttpCode(HttpStatus.OK)
  @RequirePermission(Permissions.PROJECT_ARCHIVE)
  @ApiOperation({ summary: 'Restore archived project (Admin only)' })
  @ApiResponse({ status: 200, description: 'Project restored' })
  async restoreProject(
    @Param('id') id: string,
    @CurrentUser('id') actorId: string,
  ) {
    return this.projectsService.restoreProject(id, actorId);
  }

  @Get(':id/stats')
  @RequirePermission(Permissions.PROJECT_VIEW)
  @ApiOperation({ summary: 'Get project metrics and task status counts' })
  @ApiResponse({ status: 200, description: 'Project statistics' })
  async getProjectStats(@Param('id') id: string) {
    return this.projectsService.getProjectStats(id);
  }
}
