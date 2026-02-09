import {
  Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { DosenPembimbingService } from './dosen-pembimbing.service';
import { CreateDosenPembimbingDto, UpdateDosenPembimbingDto } from './dto/dosen-pembimbing.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('dosen-pembimbing')
@Controller('dosen-pembimbing')
export class DosenPembimbingController {
  constructor(private readonly dosenPembimbingService: DosenPembimbingService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create or reuse dosen pembimbing by name' })
  @ApiResponse({ status: 201, description: 'Dosen created or found' })
  async findOrCreate(@Body() dto: CreateDosenPembimbingDto, @CurrentUser() user: any) {
    return this.dosenPembimbingService.findOrCreate(dto, user.id);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all dosen pembimbing' })
  @ApiQuery({ name: 'search', required: false })
  @ApiResponse({ status: 200, description: 'List of dosen' })
  async findAll(@Query('search') search?: string) {
    return this.dosenPembimbingService.findAll(search);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get dosen pembimbing by ID' })
  @ApiResponse({ status: 200, description: 'Dosen detail' })
  async findOne(@Param('id') id: string) {
    return this.dosenPembimbingService.findOne(BigInt(id));
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update dosen pembimbing (admin only)' })
  @ApiResponse({ status: 200, description: 'Dosen updated' })
  async update(@Param('id') id: string, @Body() dto: UpdateDosenPembimbingDto, @CurrentUser() user: any) {
    return this.dosenPembimbingService.update(BigInt(id), dto, user.id);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete dosen pembimbing (admin only)' })
  @ApiResponse({ status: 200, description: 'Dosen deleted' })
  async remove(@Param('id') id: string) {
    return this.dosenPembimbingService.remove(BigInt(id));
  }
}
