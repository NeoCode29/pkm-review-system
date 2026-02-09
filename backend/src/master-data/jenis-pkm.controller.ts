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
import { JenisPkmService } from './jenis-pkm.service';
import { CreateJenisPkmDto, UpdateJenisPkmDto } from './dto/jenis-pkm.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('master-data/jenis-pkm')
@Controller('master-data/jenis-pkm')
export class JenisPkmController {
  constructor(private readonly jenisPkmService: JenisPkmService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create jenis PKM (admin only)' })
  @ApiResponse({ status: 201, description: 'Jenis PKM created' })
  async create(@Body() dto: CreateJenisPkmDto, @CurrentUser() user: any) {
    return this.jenisPkmService.create(dto, user.id);
  }

  @Get()
  @ApiOperation({ summary: 'Get all jenis PKM' })
  @ApiResponse({ status: 200, description: 'List of jenis PKM' })
  async findAll() {
    return this.jenisPkmService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get jenis PKM by ID with kriteria' })
  @ApiResponse({ status: 200, description: 'Jenis PKM detail with kriteria' })
  @ApiResponse({ status: 404, description: 'Not found' })
  async findOne(@Param('id') id: string) {
    return this.jenisPkmService.findOne(BigInt(id));
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update jenis PKM (admin only)' })
  @ApiResponse({ status: 200, description: 'Jenis PKM updated' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateJenisPkmDto,
    @CurrentUser() user: any,
  ) {
    return this.jenisPkmService.update(BigInt(id), dto, user.id);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete jenis PKM (admin only)' })
  @ApiResponse({ status: 200, description: 'Jenis PKM deleted' })
  async remove(@Param('id') id: string) {
    return this.jenisPkmService.remove(BigInt(id));
  }
}
