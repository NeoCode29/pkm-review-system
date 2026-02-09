import { Controller, Get, Post, Put, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { PenilaianAdministrasiService } from './penilaian-administrasi.service';
import { SubmitPenilaianAdministrasiDto } from './dto/penilaian-administrasi.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('penilaian-administrasi')
@Controller('reviews')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class PenilaianAdministrasiController {
  constructor(private readonly service: PenilaianAdministrasiService) {}

  @Post(':assignmentId/administrasi')
  @ApiOperation({ summary: 'Submit penilaian administrasi checklist' })
  @ApiResponse({ status: 201, description: 'Penilaian submitted' })
  async submit(
    @Param('assignmentId') assignmentId: string,
    @Body() dto: SubmitPenilaianAdministrasiDto,
    @CurrentUser() user: any,
  ) {
    return this.service.submit(BigInt(assignmentId), dto, user.id);
  }

  @Put(':assignmentId/administrasi')
  @ApiOperation({ summary: 'Update penilaian administrasi (if reviewEnabled)' })
  @ApiResponse({ status: 200, description: 'Penilaian updated' })
  async update(
    @Param('assignmentId') assignmentId: string,
    @Body() dto: SubmitPenilaianAdministrasiDto,
    @CurrentUser() user: any,
  ) {
    return this.service.update(BigInt(assignmentId), dto, user.id);
  }

  @Get(':assignmentId/administrasi')
  @ApiOperation({ summary: 'Get penilaian administrasi (blind review enforced)' })
  @ApiResponse({ status: 200, description: 'Penilaian detail' })
  async get(@Param('assignmentId') assignmentId: string, @CurrentUser() user: any) {
    return this.service.getByAssignment(BigInt(assignmentId));
  }

  @Get('proposal/:proposalId/administrasi/errors')
  @ApiOperation({ summary: 'Get error union from all reviewers (mahasiswa view)' })
  @ApiResponse({ status: 200, description: 'Combined error list' })
  async getErrorUnion(@Param('proposalId') proposalId: string) {
    return this.service.getErrorUnion(BigInt(proposalId));
  }
}
