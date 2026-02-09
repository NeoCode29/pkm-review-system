import {
  Controller, Get, Post, Param, Res, UseGuards, UseInterceptors, UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { Response } from 'express';
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

  @Post(':id/upload')
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 10 * 1024 * 1024 } }))
  @ApiConsumes('multipart/form-data')
  @ApiBody({ schema: { type: 'object', properties: { file: { type: 'string', format: 'binary' } } } })
  @ApiOperation({ summary: 'Upload proposal PDF file (max 10MB)' })
  @ApiResponse({ status: 201, description: 'File uploaded' })
  @ApiResponse({ status: 400, description: 'Invalid file' })
  async uploadFile(
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser() user: any,
  ) {
    if (!file) {
      return { statusCode: 400, message: 'File tidak ditemukan' };
    }
    return this.proposalsService.uploadFile(BigInt(id), file, user.id);
  }

  @Get(':id/file')
  @ApiOperation({ summary: 'Get latest proposal file info + download URL' })
  @ApiResponse({ status: 200, description: 'File info with signed download URL' })
  async getFile(@Param('id') id: string) {
    return this.proposalsService.getFileDownloadUrl(BigInt(id));
  }

  @Get(':id/download')
  @ApiOperation({ summary: 'Download proposal PDF file' })
  @ApiResponse({ status: 200, description: 'PDF file stream' })
  async downloadFile(@Param('id') id: string, @Res() res: Response) {
    const { buffer, fileName, mimeType } = await this.proposalsService.downloadFile(BigInt(id));
    res.set({
      'Content-Type': mimeType,
      'Content-Disposition': `attachment; filename="${fileName}"`,
      'Content-Length': buffer.length,
    });
    res.end(buffer);
  }
}
