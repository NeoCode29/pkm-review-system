import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { TeamsService } from './teams.service';
import { CreateTeamDto, UpdateTeamDto, AddMemberDto, UpdateMemberRoleDto, CreateJoinRequestDto } from './dto/team.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';

@ApiTags('teams')
@Controller('teams')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class TeamsController {
  constructor(private readonly teamsService: TeamsService) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles('mahasiswa')
  @ApiOperation({ summary: 'Create team (auto-creates 2 proposals)' })
  @ApiResponse({ status: 201, description: 'Team created' })
  async create(@Body() dto: CreateTeamDto, @CurrentUser() user: any) {
    return this.teamsService.create(dto, user.id);
  }

  @Get()
  @ApiOperation({ summary: 'Get all teams (paginated)' })
  @ApiResponse({ status: 200, description: 'Paginated list of teams' })
  async findAll(@Query() query: PaginationQueryDto) {
    return this.teamsService.findAll({ page: query.page, limit: query.limit });
  }

  @Get('browse')
  @ApiOperation({ summary: 'Browse open teams (paginated)' })
  @ApiResponse({ status: 200, description: 'Paginated list of open teams' })
  async browse(@Query() query: PaginationQueryDto) {
    return this.teamsService.browse({ page: query.page, limit: query.limit });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get team by ID with members and proposals' })
  @ApiResponse({ status: 200, description: 'Team detail' })
  async findOne(@Param('id') id: string) {
    return this.teamsService.findOne(BigInt(id));
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update team' })
  @ApiResponse({ status: 200, description: 'Team updated' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateTeamDto,
    @CurrentUser() user: any,
  ) {
    return this.teamsService.update(BigInt(id), dto, user.id);
  }

  @Get(':id/cascade-impact')
  @UseGuards(RolesGuard)
  @Roles('admin')
  @ApiOperation({ summary: 'Preview cascade impact before deleting team (admin only)' })
  @ApiResponse({ status: 200, description: 'Cascade impact preview' })
  async getCascadeImpact(@Param('id') id: string) {
    return this.teamsService.getCascadeImpact(BigInt(id));
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete team (cascade)' })
  @ApiResponse({ status: 200, description: 'Team deleted' })
  async remove(@Param('id') id: string, @CurrentUser() user: any) {
    const isAdmin = user.role === 'admin';
    return this.teamsService.remove(BigInt(id), user.id, isAdmin);
  }

  // Member management
  @Post(':id/members')
  @ApiOperation({ summary: 'Add member to team' })
  @ApiResponse({ status: 201, description: 'Member added' })
  async addMember(
    @Param('id') id: string,
    @Body() dto: AddMemberDto,
    @CurrentUser() user: any,
  ) {
    return this.teamsService.addMember(BigInt(id), dto, user.id);
  }

  @Delete(':teamId/members/:memberId')
  @ApiOperation({ summary: 'Remove member from team' })
  @ApiResponse({ status: 200, description: 'Member removed' })
  async removeMember(
    @Param('teamId') teamId: string,
    @Param('memberId') memberId: string,
    @CurrentUser() user: any,
  ) {
    return this.teamsService.removeMember(BigInt(teamId), BigInt(memberId), user.id);
  }

  @Put(':teamId/members/:memberId/role')
  @ApiOperation({ summary: 'Update member role' })
  @ApiResponse({ status: 200, description: 'Role updated' })
  async updateMemberRole(
    @Param('teamId') teamId: string,
    @Param('memberId') memberId: string,
    @Body() dto: UpdateMemberRoleDto,
  ) {
    return this.teamsService.updateMemberRole(BigInt(teamId), BigInt(memberId), dto.role);
  }

  // Join requests
  @Post(':id/join-requests')
  @UseGuards(RolesGuard)
  @Roles('mahasiswa')
  @ApiOperation({ summary: 'Send join request to team' })
  @ApiResponse({ status: 201, description: 'Join request sent' })
  async createJoinRequest(
    @Param('id') id: string,
    @Body() dto: CreateJoinRequestDto,
    @CurrentUser() user: any,
  ) {
    return this.teamsService.createJoinRequest(BigInt(id), user.id, dto.message);
  }

  @Get(':id/join-requests')
  @ApiOperation({ summary: 'Get join requests for team' })
  @ApiResponse({ status: 200, description: 'List of join requests' })
  async getJoinRequests(@Param('id') id: string) {
    return this.teamsService.getJoinRequests(BigInt(id));
  }

  @Put('join-requests/:requestId/approve')
  @ApiOperation({ summary: 'Approve join request' })
  @ApiResponse({ status: 200, description: 'Request approved' })
  async approveJoinRequest(
    @Param('requestId') requestId: string,
    @CurrentUser() user: any,
  ) {
    return this.teamsService.approveJoinRequest(BigInt(requestId), user.id);
  }

  @Put('join-requests/:requestId/reject')
  @ApiOperation({ summary: 'Reject join request' })
  @ApiResponse({ status: 200, description: 'Request rejected' })
  async rejectJoinRequest(
    @Param('requestId') requestId: string,
    @CurrentUser() user: any,
  ) {
    return this.teamsService.rejectJoinRequest(BigInt(requestId), user.id);
  }
}
