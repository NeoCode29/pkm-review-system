import { Controller, Get, Post, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { PdfAnnotationsService } from './pdf-annotations.service';
import { CreatePdfAnnotationDto } from './dto/pdf-annotation.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('pdf-annotations')
@Controller('annotations')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class PdfAnnotationsController {
  constructor(private readonly service: PdfAnnotationsService) {}

  @Post()
  @ApiOperation({ summary: 'Create annotation (highlight/comment)' })
  @ApiResponse({ status: 201, description: 'Annotation created' })
  async create(@Body() dto: CreatePdfAnnotationDto, @CurrentUser() user: any) {
    return this.service.create(dto, user.id);
  }

  @Get('file/:fileId')
  @ApiOperation({ summary: 'Get annotations by file (blind review enforced)' })
  @ApiResponse({ status: 200, description: 'List of annotations' })
  async findByFile(@Param('fileId') fileId: string, @CurrentUser() user: any) {
    const isAdmin = user.role === 'admin';
    return this.service.findByFile(BigInt(fileId), user.id, isAdmin);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete annotation (if reviewEnabled)' })
  @ApiResponse({ status: 200, description: 'Annotation deleted' })
  async remove(@Param('id') id: string, @CurrentUser() user: any) {
    return this.service.remove(BigInt(id), user.id);
  }
}
