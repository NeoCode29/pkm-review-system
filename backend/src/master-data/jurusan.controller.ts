import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JurusanService } from './jurusan.service';
import { CreateJurusanDto, UpdateJurusanDto } from './dto/jurusan.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('master-data/jurusan')
@Controller('master-data/jurusan')
export class JurusanController {
  constructor(private readonly jurusanService: JurusanService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create jurusan (admin only)' })
  @ApiResponse({ status: 201, description: 'Jurusan created' })
  async create(@Body() dto: CreateJurusanDto, @CurrentUser() user: any) {
    return this.jurusanService.create(dto, user.id);
  }

  @Get()
  @ApiOperation({ summary: 'Get all jurusan' })
  @ApiResponse({ status: 200, description: 'List of jurusan' })
  async findAll() {
    return this.jurusanService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get jurusan by ID' })
  @ApiResponse({ status: 200, description: 'Jurusan detail' })
  @ApiResponse({ status: 404, description: 'Not found' })
  async findOne(@Param('id') id: string) {
    return this.jurusanService.findOne(BigInt(id));
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update jurusan (admin only)' })
  @ApiResponse({ status: 200, description: 'Jurusan updated' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateJurusanDto,
    @CurrentUser() user: any,
  ) {
    return this.jurusanService.update(BigInt(id), dto, user.id);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete jurusan (admin only)' })
  @ApiResponse({ status: 200, description: 'Jurusan deleted' })
  async remove(@Param('id') id: string) {
    return this.jurusanService.remove(BigInt(id));
  }
}
