import {
  Controller, Get, Post, Put, Delete, Body, Param, UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { ReviewersService } from './reviewers.service';
import { CreateReviewerDto, UpdateReviewerDto } from './dto/reviewer.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('reviewers')
@Controller()
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ReviewersController {
  constructor(private readonly reviewersService: ReviewersService) {}

  @Post('admin/reviewers')
  @UseGuards(RolesGuard)
  @Roles('admin')
  @ApiOperation({ summary: 'Create reviewer (one-step, admin only)' })
  @ApiResponse({ status: 201, description: 'Reviewer created' })
  async create(@Body() dto: CreateReviewerDto, @CurrentUser() user: any) {
    return this.reviewersService.create(dto, user.id);
  }

  @Get('reviewers')
  @ApiOperation({ summary: 'Get all reviewers' })
  @ApiResponse({ status: 200, description: 'List of reviewers' })
  async findAll() {
    return this.reviewersService.findAll();
  }

  @Get('reviewers/:id')
  @ApiOperation({ summary: 'Get reviewer detail with stats' })
  @ApiResponse({ status: 200, description: 'Reviewer detail' })
  async findOne(@Param('id') id: string) {
    return this.reviewersService.findOne(BigInt(id));
  }

  @Put('reviewers/:id')
  @UseGuards(RolesGuard)
  @Roles('admin')
  @ApiOperation({ summary: 'Update reviewer (admin only)' })
  @ApiResponse({ status: 200, description: 'Reviewer updated' })
  async update(@Param('id') id: string, @Body() dto: UpdateReviewerDto, @CurrentUser() user: any) {
    return this.reviewersService.update(BigInt(id), dto, user.id);
  }

  @Delete('reviewers/:id')
  @UseGuards(RolesGuard)
  @Roles('admin')
  @ApiOperation({ summary: 'Delete reviewer (admin only)' })
  @ApiResponse({ status: 200, description: 'Reviewer deleted' })
  async remove(@Param('id') id: string) {
    return this.reviewersService.remove(BigInt(id));
  }
}
