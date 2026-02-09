import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePdfAnnotationDto } from './dto/pdf-annotation.dto';

@Injectable()
export class PdfAnnotationsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreatePdfAnnotationDto, userId: string) {
    // Validate assignment belongs to user
    const assignment = await this.prisma.reviewerAssignment.findUnique({
      where: { id: BigInt(dto.reviewerAssignmentId) },
      include: { reviewerUser: true },
    });
    if (!assignment) {
      throw new NotFoundException('Assignment tidak ditemukan');
    }
    if (assignment.reviewerUser.userId !== userId) {
      throw new ForbiddenException('Anda tidak memiliki akses ke assignment ini');
    }

    // Validate file exists
    const file = await this.prisma.proposalFile.findUnique({
      where: { id: BigInt(dto.proposalFileId) },
    });
    if (!file) {
      throw new NotFoundException('File tidak ditemukan');
    }

    return this.prisma.pdfAnnotation.create({
      data: {
        proposalFileId: BigInt(dto.proposalFileId),
        reviewerAssignmentId: BigInt(dto.reviewerAssignmentId),
        type: dto.type as any,
        pageNumber: dto.pageNumber,
        annotationData: dto.annotationData,
      },
    });
  }

  // Blind review: only show own annotations during review
  async findByFile(fileId: bigint, userId: string, isAdmin = false) {
    if (isAdmin) {
      return this.prisma.pdfAnnotation.findMany({
        where: { proposalFileId: fileId },
        orderBy: [{ pageNumber: 'asc' }, { createdAt: 'asc' }],
        include: {
          reviewerAssignment: {
            select: { reviewerNumber: true, reviewerUser: { select: { nama: true } } },
          },
        },
      });
    }

    // Find reviewer's assignment
    const reviewer = await this.prisma.reviewerUser.findUnique({
      where: { userId },
    });
    if (!reviewer) {
      throw new ForbiddenException('Akses ditolak');
    }

    return this.prisma.pdfAnnotation.findMany({
      where: {
        proposalFileId: fileId,
        reviewerAssignment: { reviewerUserId: reviewer.id },
      },
      orderBy: [{ pageNumber: 'asc' }, { createdAt: 'asc' }],
    });
  }

  async remove(id: bigint, userId: string) {
    const annotation = await this.prisma.pdfAnnotation.findUnique({
      where: { id },
      include: { reviewerAssignment: { include: { reviewerUser: true } } },
    });
    if (!annotation) {
      throw new NotFoundException('Annotation tidak ditemukan');
    }
    if (annotation.reviewerAssignment.reviewerUser.userId !== userId) {
      throw new ForbiddenException('Anda tidak memiliki akses');
    }

    // Check toggle
    const toggle = await this.prisma.systemConfig.findUnique({
      where: { configKey: 'reviewEnabled' },
    });
    if (toggle && !(toggle.configValue as any)?.enabled) {
      throw new BadRequestException('Tidak bisa menghapus annotation saat review tidak aktif');
    }

    return this.prisma.pdfAnnotation.delete({ where: { id } });
  }
}
