import { Controller, Get, Post, Put, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { PenilaianSubstansiService } from './penilaian-substansi.service';
import { SubmitPenilaianSubstansiDto } from './dto/penilaian-substansi.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('penilaian-substansi')
@Controller('reviews')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class PenilaianSubstansiController {
  constructor(private readonly service: PenilaianSubstansiService) {}

  @Post(':assignmentId/substansi')
  @ApiOperation({ summary: 'Submit penilaian substansi scores' })
  @ApiResponse({ status: 201, description: 'Penilaian submitted' })
  async submit(
    @Param('assignmentId') assignmentId: string,
    @Body() dto: SubmitPenilaianSubstansiDto,
    @CurrentUser() user: any,
  ) {
    return this.service.submit(BigInt(assignmentId), dto, user.id);
  }

  @Put(':assignmentId/substansi')
  @ApiOperation({ summary: 'Update penilaian substansi (if reviewEnabled)' })
  @ApiResponse({ status: 200, description: 'Penilaian updated' })
  async update(
    @Param('assignmentId') assignmentId: string,
    @Body() dto: SubmitPenilaianSubstansiDto,
    @CurrentUser() user: any,
  ) {
    return this.service.update(BigInt(assignmentId), dto, user.id);
  }

  @Get(':assignmentId/substansi')
  @ApiOperation({ summary: 'Get penilaian substansi (blind review enforced)' })
  @ApiResponse({ status: 200, description: 'Penilaian detail' })
  async get(@Param('assignmentId') assignmentId: string) {
    return this.service.getByAssignment(BigInt(assignmentId));
  }

  @Get('proposal/:proposalId/summary')
  @ApiOperation({ summary: 'Get review summary for proposal (mahasiswa view, blind review)' })
  @ApiResponse({ status: 200, description: 'Review summary with scores per reviewer' })
  async getReviewSummary(@Param('proposalId') proposalId: string) {
    return this.service.getReviewSummary(BigInt(proposalId));
  }
}
