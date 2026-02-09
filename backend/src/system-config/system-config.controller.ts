import { Controller, Get, Put, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { SystemConfigService } from './system-config.service';
import { UpdateToggleDto } from './dto/system-config.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('system-config')
@Controller('config')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class SystemConfigController {
  constructor(private readonly configService: SystemConfigService) {}

  @Get()
  @ApiOperation({ summary: 'Get all toggle states' })
  @ApiResponse({ status: 200, description: 'Toggle states' })
  async getAll() {
    return this.configService.getAllToggles();
  }

  @Get('audit-log')
  @UseGuards(RolesGuard)
  @Roles('admin')
  @ApiOperation({ summary: 'Get toggle change audit log (admin only)' })
  @ApiResponse({ status: 200, description: 'Audit log entries' })
  async getAuditLog(@Query('limit') limit?: string) {
    return this.configService.getAuditLog(limit ? parseInt(limit, 10) : 50);
  }

  @Get(':key')
  @ApiOperation({ summary: 'Get single toggle state' })
  @ApiResponse({ status: 200, description: 'Toggle state' })
  async getOne(@Param('key') key: string) {
    return this.configService.getToggle(key);
  }

  @Put(':key')
  @UseGuards(RolesGuard)
  @Roles('admin')
  @ApiOperation({ summary: 'Update toggle (auto-exclusive + side effects)' })
  @ApiResponse({ status: 200, description: 'Updated toggle states' })
  async update(
    @Param('key') key: string,
    @Body() dto: UpdateToggleDto,
    @CurrentUser() user: any,
  ) {
    return this.configService.updateToggle(key, dto.enabled, user.id);
  }
}
