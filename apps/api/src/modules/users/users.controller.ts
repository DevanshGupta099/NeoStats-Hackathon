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
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
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
@Controller('users')
@RequirePermission(Permissions.USER_MANAGE)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @ApiOperation({ summary: 'List and filter users (Admin only)' })
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
