import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  UsePipes,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiBody } from '@nestjs/swagger';
import { MembersService } from './members.service';
import { RequirePermission } from '../../common/policy/require-permission.decorator';
import { CurrentUser, AuthenticatedUser } from '../auth/decorators/current-user.decorator';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import {
  Permissions,
  AddProjectMemberSchema,
  AddProjectMemberInput,
  UpdateProjectMemberSchema,
  UpdateProjectMemberInput,
} from '@forgeline/shared';

@ApiTags('Members')
@ApiBearerAuth('bearer-jwt')
@Controller('projects/:projectId/members')
export class MembersController {
  constructor(private readonly membersService: MembersService) {}

  @Get()
  @RequirePermission(Permissions.PROJECT_VIEW)
  @ApiOperation({ summary: 'List project members' })
  @ApiResponse({ status: 200, description: 'List of members' })
  async listMembers(@Param('projectId') projectId: string) {
    return this.membersService.listMembers(projectId);
  }

  @Post()
  @RequirePermission(Permissions.PROJECT_MANAGE_MEMBERS)
  @ApiOperation({ summary: 'Add a new member to the project' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['userId'],
      properties: {
        userId: { type: 'string', example: 'c0a80101-0000-0000-0000-000000000003', description: 'User ID to add' },
        projectRole: { type: 'string', enum: ['MANAGER', 'MEMBER', 'VIEWER'], example: 'MEMBER' },
      },
    },
  })
  @ApiResponse({ status: 201, description: 'Member added' })
  @ApiResponse({ status: 403, description: 'Forbidden (e.g. non-admin assigning PM)' })
  @ApiResponse({ status: 409, description: 'User already a member' })
  @UsePipes(new ZodValidationPipe(AddProjectMemberSchema))
  async addMember(
    @Param('projectId') projectId: string,
    @Body() dto: AddProjectMemberInput,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.membersService.addMember(projectId, dto, actor);
  }

  @Patch(':userId')
  @RequirePermission(Permissions.PROJECT_MANAGE_MEMBERS)
  @ApiOperation({ summary: 'Update project role of an existing member' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['projectRole'],
      properties: {
        projectRole: { type: 'string', enum: ['MANAGER', 'MEMBER', 'VIEWER'], example: 'MANAGER' },
      },
    },
  })
  @ApiResponse({ status: 200, description: 'Member role updated' })
  @UsePipes(new ZodValidationPipe(UpdateProjectMemberSchema))
  async updateMemberRole(
    @Param('projectId') projectId: string,
    @Param('userId') targetUserId: string,
    @Body() dto: UpdateProjectMemberInput,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.membersService.updateMemberRole(projectId, targetUserId, dto, actor);
  }

  @Delete(':userId')
  @HttpCode(HttpStatus.OK)
  @RequirePermission(Permissions.PROJECT_MANAGE_MEMBERS)
  @ApiOperation({ summary: 'Remove a member from the project' })
  @ApiResponse({ status: 200, description: 'Member removed' })
  async removeMember(
    @Param('projectId') projectId: string,
    @Param('userId') targetUserId: string,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.membersService.removeMember(projectId, targetUserId, actor);
  }
}
