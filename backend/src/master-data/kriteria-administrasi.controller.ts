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
import { KriteriaAdministrasiService } from './kriteria-administrasi.service';
import {
  CreateKriteriaAdministrasiDto,
  UpdateKriteriaAdministrasiDto,
} from './dto/kriteria-administrasi.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('master-data/kriteria-administrasi')
@Controller('master-data/kriteria-administrasi')
export class KriteriaAdministrasiController {
  constructor(
    private readonly kriteriaAdministrasiService: KriteriaAdministrasiService,
  ) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create kriteria administrasi (admin only)' })
  @ApiResponse({ status: 201, description: 'Kriteria created' })
  async create(
    @Body() dto: CreateKriteriaAdministrasiDto,
    @CurrentUser() user: any,
  ) {
    return this.kriteriaAdministrasiService.create(dto, user.id);
  }

  @Get('jenis-pkm/:jenisPkmId')
  @ApiOperation({ summary: 'Get kriteria administrasi by jenis PKM' })
  @ApiResponse({ status: 200, description: 'List of kriteria' })
  async findByJenisPkm(@Param('jenisPkmId') jenisPkmId: string) {
    return this.kriteriaAdministrasiService.findByJenisPkm(BigInt(jenisPkmId));
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get kriteria administrasi by ID' })
  @ApiResponse({ status: 200, description: 'Kriteria detail' })
  @ApiResponse({ status: 404, description: 'Not found' })
  async findOne(@Param('id') id: string) {
    return this.kriteriaAdministrasiService.findOne(BigInt(id));
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update kriteria administrasi (admin only)' })
  @ApiResponse({ status: 200, description: 'Kriteria updated' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateKriteriaAdministrasiDto,
    @CurrentUser() user: any,
  ) {
    return this.kriteriaAdministrasiService.update(BigInt(id), dto, user.id);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete kriteria administrasi (admin only)' })
  @ApiResponse({ status: 200, description: 'Kriteria deleted' })
  async remove(@Param('id') id: string) {
    return this.kriteriaAdministrasiService.remove(BigInt(id));
  }
}
