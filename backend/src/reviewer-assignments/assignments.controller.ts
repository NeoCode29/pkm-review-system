import {
  Controller, Get, Post, Delete, Body, Param, UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AssignmentsService } from './assignments.service';
import { AssignReviewersDto, BulkAssignDto } from './dto/assignment.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('reviewer-assignments')
@Controller()
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class AssignmentsController {
  constructor(private readonly assignmentsService: AssignmentsService) {}

  @Post('admin/assignments')
  @UseGuards(RolesGuard)
  @Roles('admin')
  @ApiOperation({ summary: 'Assign 2 reviewers to proposal (admin only)' })
  @ApiResponse({ status: 201, description: 'Reviewers assigned' })
  async assign(@Body() dto: AssignReviewersDto, @CurrentUser() user: any) {
    return this.assignmentsService.assign(dto, user.id);
  }

  @Post('admin/assignments/bulk')
  @UseGuards(RolesGuard)
  @Roles('admin')
  @ApiOperation({ summary: 'Bulk assign reviewers (admin only)' })
  @ApiResponse({ status: 201, description: 'Bulk assignment results' })
  async bulkAssign(@Body() dto: BulkAssignDto, @CurrentUser() user: any) {
    return this.assignmentsService.bulkAssign(dto, user.id);
  }

  @Get('reviewers/my-assignments')
  @ApiOperation({ summary: 'Get my assignments (reviewer)' })
  @ApiResponse({ status: 200, description: 'List of assignments' })
  async getMyAssignments(@CurrentUser() user: any) {
    return this.assignmentsService.getMyAssignments(user.id);
  }

  @Get('admin/assignments/proposal/:proposalId')
  @UseGuards(RolesGuard)
  @Roles('admin')
  @ApiOperation({ summary: 'Get assignments by proposal (admin)' })
  @ApiResponse({ status: 200, description: 'List of assignments' })
  async findByProposal(@Param('proposalId') proposalId: string) {
    return this.assignmentsService.findByProposal(BigInt(proposalId));
  }

  @Delete('admin/assignments/:id')
  @UseGuards(RolesGuard)
  @Roles('admin')
  @ApiOperation({ summary: 'Unassign reviewer (admin only)' })
  @ApiResponse({ status: 200, description: 'Assignment removed' })
  async unassign(@Param('id') id: string) {
    return this.assignmentsService.unassign(BigInt(id));
  }
}
