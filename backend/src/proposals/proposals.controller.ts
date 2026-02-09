import {
  Controller, Get, Post, Param, UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { ProposalsService } from './proposals.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('proposals')
@Controller('proposals')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ProposalsController {
  constructor(private readonly proposalsService: ProposalsService) {}

  @Get(':id')
  @ApiOperation({ summary: 'Get proposal detail' })
  @ApiResponse({ status: 200, description: 'Proposal detail' })
  async findOne(@Param('id') id: string) {
    return this.proposalsService.findOne(BigInt(id));
  }

  @Get('team/:teamId')
  @ApiOperation({ summary: 'Get proposals by team' })
  @ApiResponse({ status: 200, description: 'List of proposals' })
  async findByTeam(@Param('teamId') teamId: string) {
    return this.proposalsService.findByTeam(BigInt(teamId));
  }

  @Post(':id/submit')
  @ApiOperation({ summary: 'Submit proposal (draft → submitted)' })
  @ApiResponse({ status: 200, description: 'Proposal submitted' })
  async submit(@Param('id') id: string, @CurrentUser() user: any) {
    return this.proposalsService.submitProposal(BigInt(id), user.id);
  }

  @Get(':id/file')
  @ApiOperation({ summary: 'Get latest proposal file info' })
  @ApiResponse({ status: 200, description: 'File info' })
  async getFile(@Param('id') id: string) {
    return this.proposalsService.getFile(BigInt(id));
  }
}
