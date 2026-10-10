import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Query,
  UsePipes,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiBody, ApiQuery } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { RequirePermission } from '../../common/policy/require-permission.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import {
  Permissions,
  CreateUserSchema,
  CreateUserInput,
  UpdateUserSchema,
  UpdateUserInput,
  GlobalRole,
} from '@forgeline/shared';

@ApiTags('Users')
@ApiBearerAuth('bearer-jwt')
@Controller('users')
@RequirePermission(Permissions.USER_MANAGE)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @ApiOperation({ summary: 'List and filter users (Admin only)' })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'role', required: false, enum: GlobalRole })
  @ApiQuery({ name: 'isActive', required: false, type: Boolean })
  @ApiQuery({ name: 'cursor', required: false, type: String })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Paginated user list' })
  async listUsers(
    @Query('search') search?: string,
    @Query('role') role?: GlobalRole,
    @Query('isActive') isActiveStr?: string,
    @Query('cursor') cursor?: string,
    @Query('limit') limitStr?: string,
  ) {
    const isActive = isActiveStr === undefined ? undefined : isActiveStr === 'true';
    const limit = limitStr ? parseInt(limitStr, 10) : undefined;
    return this.usersService.listUsers({ search, role, isActive, cursor, limit });
  }

  @Post()
  @ApiOperation({ summary: 'Create a new user account (Admin only)' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['email', 'name', 'handle', 'password'],
      properties: {
        email: { type: 'string', example: 'engineer.senior@forgeline.dev' },
        name: { type: 'string', example: 'Senior Engineer' },
        handle: { type: 'string', example: 'eng_lead' },
        password: { type: 'string', example: 'Forge@12345' },
        globalRole: { type: 'string', enum: ['ADMIN', 'PROJECT_MANAGER', 'TEAM_MEMBER', 'VIEWER'], example: 'TEAM_MEMBER' },
      },
    },
  })
  @ApiResponse({ status: 201, description: 'User account created' })
  @UsePipes(new ZodValidationPipe(CreateUserSchema))
  async createUser(
    @Body() dto: CreateUserInput,
    @CurrentUser('id') actorId: string,
  ) {
    return this.usersService.createUser(dto, actorId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get user details by ID (Admin only)' })
  @ApiResponse({ status: 200, description: 'User details' })
  async getUser(@Param('id') id: string) {
    return this.usersService.getUser(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update user profile and roles (Admin only)' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        name: { type: 'string', example: 'Senior Systems Architect' },
        handle: { type: 'string', example: 'arch_lead' },
        globalRole: { type: 'string', enum: ['ADMIN', 'PROJECT_MANAGER', 'TEAM_MEMBER', 'VIEWER'], example: 'PROJECT_MANAGER' },
        isActive: { type: 'boolean', example: true },
      },
    },
  })
  @ApiResponse({ status: 200, description: 'User updated' })
  @UsePipes(new ZodValidationPipe(UpdateUserSchema))
  async updateUser(
    @Param('id') id: string,
    @Body() dto: UpdateUserInput,
    @CurrentUser('id') actorId: string,
  ) {
    return this.usersService.updateUser(id, dto, actorId);
  }

  @Post(':id/deactivate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Deactivate user, bumping token version and revoking sessions (Admin only)' })
  @ApiResponse({ status: 200, description: 'User deactivated' })
  async deactivateUser(
    @Param('id') id: string,
    @CurrentUser('id') actorId: string,
  ) {
    return this.usersService.deactivateUser(id, actorId);
  }

  @Post(':id/reactivate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reactivate deactivated user account (Admin only)' })
  @ApiResponse({ status: 200, description: 'User reactivated' })
  async reactivateUser(
    @Param('id') id: string,
    @CurrentUser('id') actorId: string,
  ) {
    return this.usersService.reactivateUser(id, actorId);
  }
}
