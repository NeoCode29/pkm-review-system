import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { DashboardService } from './dashboard.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('dashboard')
@Controller('dashboard')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('admin')
  @UseGuards(RolesGuard)
  @Roles('admin')
  @ApiOperation({ summary: 'Admin dashboard with stats and phase detection' })
  @ApiResponse({ status: 200, description: 'Admin dashboard data' })
  async getAdminDashboard() {
    return this.dashboardService.getAdminDashboard();
  }

  @Get('reviewer')
  @UseGuards(RolesGuard)
  @Roles('reviewer')
  @ApiOperation({ summary: 'Reviewer dashboard with progress' })
  @ApiResponse({ status: 200, description: 'Reviewer dashboard data' })
  async getReviewerDashboard(@CurrentUser() user: any) {
    return this.dashboardService.getReviewerDashboard(user.id);
  }

  @Get('mahasiswa')
  @UseGuards(RolesGuard)
  @Roles('mahasiswa')
  @ApiOperation({ summary: 'Mahasiswa dashboard (team or browse)' })
  @ApiResponse({ status: 200, description: 'Mahasiswa dashboard data' })
  async getMahasiswaDashboard(@CurrentUser() user: any) {
    return this.dashboardService.getMahasiswaDashboard(user.id);
  }
}
