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
import { KriteriaSubstansiService } from './kriteria-substansi.service';
import {
  CreateKriteriaSubstansiDto,
  UpdateKriteriaSubstansiDto,
} from './dto/kriteria-substansi.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('master-data/kriteria-substansi')
@Controller('master-data/kriteria-substansi')
export class KriteriaSubstansiController {
  constructor(
    private readonly kriteriaSubstansiService: KriteriaSubstansiService,
  ) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create kriteria substansi (admin only)' })
  @ApiResponse({ status: 201, description: 'Kriteria created' })
  async create(
    @Body() dto: CreateKriteriaSubstansiDto,
    @CurrentUser() user: any,
  ) {
    return this.kriteriaSubstansiService.create(dto, user.id);
  }

  @Get('jenis-pkm/:jenisPkmId')
  @ApiOperation({ summary: 'Get kriteria substansi by jenis PKM' })
  @ApiResponse({ status: 200, description: 'List of kriteria' })
  async findByJenisPkm(@Param('jenisPkmId') jenisPkmId: string) {
    return this.kriteriaSubstansiService.findByJenisPkm(BigInt(jenisPkmId));
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get kriteria substansi by ID' })
  @ApiResponse({ status: 200, description: 'Kriteria detail' })
  @ApiResponse({ status: 404, description: 'Not found' })
  async findOne(@Param('id') id: string) {
    return this.kriteriaSubstansiService.findOne(BigInt(id));
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update kriteria substansi (admin only)' })
  @ApiResponse({ status: 200, description: 'Kriteria updated' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateKriteriaSubstansiDto,
    @CurrentUser() user: any,
  ) {
    return this.kriteriaSubstansiService.update(BigInt(id), dto, user.id);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete kriteria substansi (admin only)' })
  @ApiResponse({ status: 200, description: 'Kriteria deleted' })
  async remove(@Param('id') id: string) {
    return this.kriteriaSubstansiService.remove(BigInt(id));
  }
}
