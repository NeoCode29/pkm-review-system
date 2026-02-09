import {
  Controller,
  Get,
  Put,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { MahasiswaService } from './mahasiswa.service';
import { UpdateMahasiswaDto } from './dto/mahasiswa.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('mahasiswa')
@Controller('mahasiswa')
export class MahasiswaController {
  constructor(private readonly mahasiswaService: MahasiswaService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all mahasiswa' })
  @ApiQuery({ name: 'search', required: false })
  @ApiResponse({ status: 200, description: 'List of mahasiswa' })
  async findAll(@Query('search') search?: string) {
    return this.mahasiswaService.findAll(search);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current mahasiswa profile' })
  @ApiResponse({ status: 200, description: 'Mahasiswa profile' })
  async getMyProfile(@CurrentUser() user: any) {
    return this.mahasiswaService.findByUserId(user.id);
  }

  @Get('dashboard')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('mahasiswa')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get mahasiswa dashboard (has team vs no team)' })
  @ApiResponse({ status: 200, description: 'Dashboard data' })
  async getDashboard(@CurrentUser() user: any) {
    return this.mahasiswaService.getDashboard(user.id);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get mahasiswa by ID' })
  @ApiResponse({ status: 200, description: 'Mahasiswa detail' })
  @ApiResponse({ status: 404, description: 'Not found' })
  async findOne(@Param('id') id: string) {
    return this.mahasiswaService.findOne(BigInt(id));
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update mahasiswa profile' })
  @ApiResponse({ status: 200, description: 'Mahasiswa updated' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateMahasiswaDto,
    @CurrentUser() user: any,
  ) {
    return this.mahasiswaService.update(BigInt(id), dto, user.id);
  }
}
