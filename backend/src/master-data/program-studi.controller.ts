import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { ProgramStudiService } from './program-studi.service';
import { CreateProgramStudiDto, UpdateProgramStudiDto } from './dto/program-studi.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('master-data/program-studi')
@Controller('master-data/program-studi')
export class ProgramStudiController {
  constructor(private readonly programStudiService: ProgramStudiService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create program studi (admin only)' })
  @ApiResponse({ status: 201, description: 'Program Studi created' })
  async create(@Body() dto: CreateProgramStudiDto, @CurrentUser() user: any) {
    return this.programStudiService.create(dto, user.id);
  }

  @Get()
  @ApiOperation({ summary: 'Get all program studi' })
  @ApiQuery({ name: 'jurusanId', required: false, description: 'Filter by jurusan ID' })
  @ApiResponse({ status: 200, description: 'List of program studi' })
  async findAll(@Query('jurusanId') jurusanId?: string) {
    return this.programStudiService.findAll(jurusanId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get program studi by ID' })
  @ApiResponse({ status: 200, description: 'Program Studi detail' })
  @ApiResponse({ status: 404, description: 'Not found' })
  async findOne(@Param('id') id: string) {
    return this.programStudiService.findOne(BigInt(id));
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update program studi (admin only)' })
  @ApiResponse({ status: 200, description: 'Program Studi updated' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateProgramStudiDto,
    @CurrentUser() user: any,
  ) {
    return this.programStudiService.update(BigInt(id), dto, user.id);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete program studi (admin only)' })
  @ApiResponse({ status: 200, description: 'Program Studi deleted' })
  async remove(@Param('id') id: string) {
    return this.programStudiService.remove(BigInt(id));
  }
}
