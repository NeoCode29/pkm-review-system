import { Controller, Get, Put, Delete, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@ApiTags('users')
@Controller('admin/users')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
@ApiBearerAuth()
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @ApiOperation({ summary: 'List all users (admin only)' })
  @ApiResponse({ status: 200, description: 'List of all users' })
  async findAll() {
    return this.usersService.findAll();
  }

  @Put(':userId/activate')
  @ApiOperation({ summary: 'Activate user (admin only)' })
  @ApiResponse({ status: 200, description: 'User activated' })
  async activate(@Param('userId') userId: string) {
    return this.usersService.activate(userId);
  }

  @Put(':userId/deactivate')
  @ApiOperation({ summary: 'Deactivate user (admin only)' })
  @ApiResponse({ status: 200, description: 'User deactivated' })
  async deactivate(@Param('userId') userId: string) {
    return this.usersService.deactivate(userId);
  }

  @Delete(':userId')
  @ApiOperation({ summary: 'Delete user (admin only, hard delete + SET NULL)' })
  @ApiResponse({ status: 200, description: 'User deleted' })
  async remove(@Param('userId') userId: string) {
    return this.usersService.remove(userId);
  }
}
