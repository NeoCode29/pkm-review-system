import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SubmitPenilaianAdministrasiDto } from './dto/penilaian-administrasi.dto';

@Injectable()
export class PenilaianAdministrasiService {
  constructor(private readonly prisma: PrismaService) {}

  async submit(assignmentId: bigint, dto: SubmitPenilaianAdministrasiDto, userId: string) {
    const assignment = await this.validateAssignment(assignmentId, userId);

    // Check not already submitted
    const existing = await this.prisma.penilaianAdministrasi.findUnique({
      where: { reviewerAssignmentId: assignmentId },
    });
    if (existing) {
      throw new BadRequestException('Penilaian administrasi sudah disubmit. Gunakan PUT untuk update.');
    }

    // Validate checklist items against kriteria for this jenis PKM
    const proposal = await this.prisma.proposal.findUnique({
      where: { id: assignment.proposalId },
      include: { team: { select: { jenisPkmId: true } } },
    });
    if (!proposal) throw new NotFoundException('Proposal tidak ditemukan');

    const kriteriaList = await this.prisma.kriteriaAdministrasi.findMany({
      where: { jenisPkmId: proposal.team.jenisPkmId },
    });

    // Calculate error count
    const totalKesalahan = dto.checklist.filter((c) => c.adaKesalahan).length;

    return this.prisma.$transaction(async (tx) => {
      const penilaian = await tx.penilaianAdministrasi.create({
        data: {
          reviewerAssignmentId: assignmentId,
          totalKesalahan,
          catatan: dto.catatan,
          isComplete: true,
        },
      });

      // Create detail items
      for (const item of dto.checklist) {
        await tx.detailPenilaianAdministrasi.create({
          data: {
            penilaianAdministrasiId: penilaian.id,
            kriteriaAdministrasiId: BigInt(item.kriteriaAdministrasiId),
            adaKesalahan: item.adaKesalahan,
          },
        });
      }

      return this.getByAssignment(assignmentId, tx);
    });
  }

  async update(assignmentId: bigint, dto: SubmitPenilaianAdministrasiDto, userId: string) {
    await this.validateAssignment(assignmentId, userId);

    // Check toggle
    await this.checkReviewToggle();

    const existing = await this.prisma.penilaianAdministrasi.findUnique({
      where: { reviewerAssignmentId: assignmentId },
    });
    if (!existing) {
      throw new NotFoundException('Penilaian administrasi belum disubmit');
    }

    const totalKesalahan = dto.checklist.filter((c) => c.adaKesalahan).length;

    return this.prisma.$transaction(async (tx) => {
      // Update main record
      await tx.penilaianAdministrasi.update({
        where: { id: existing.id },
        data: { totalKesalahan, catatan: dto.catatan },
      });

      // Delete old details and recreate
      await tx.detailPenilaianAdministrasi.deleteMany({
        where: { penilaianAdministrasiId: existing.id },
      });

      for (const item of dto.checklist) {
        await tx.detailPenilaianAdministrasi.create({
          data: {
            penilaianAdministrasiId: existing.id,
            kriteriaAdministrasiId: BigInt(item.kriteriaAdministrasiId),
            adaKesalahan: item.adaKesalahan,
          },
        });
      }

      return this.getByAssignment(assignmentId, tx);
    });
  }

  async getByAssignment(assignmentId: bigint, prismaClient?: any) {
    const client = prismaClient || this.prisma;
    const penilaian = await client.penilaianAdministrasi.findUnique({
      where: { reviewerAssignmentId: assignmentId },
      include: {
        detailPenilaianAdministrasi: {
          include: {
            kriteriaAdministrasi: { select: { id: true, deskripsi: true, urutan: true } },
          },
          orderBy: { kriteriaAdministrasi: { urutan: 'asc' } },
        },
      },
    });
    return penilaian;
  }

  private async validateAssignment(assignmentId: bigint, userId: string) {
    const assignment = await this.prisma.reviewerAssignment.findUnique({
      where: { id: assignmentId },
      include: { reviewerUser: true },
    });
    if (!assignment) {
      throw new NotFoundException('Assignment tidak ditemukan');
    }
    if (assignment.reviewerUser.userId !== userId) {
      throw new ForbiddenException('Anda tidak memiliki akses ke assignment ini');
    }
    return assignment;
  }

  private async checkReviewToggle() {
    const toggle = await this.prisma.systemConfig.findUnique({
      where: { configKey: 'reviewEnabled' },
    });
    if (toggle && !(toggle.configValue as any)?.enabled) {
      throw new BadRequestException('Review sedang tidak aktif');
    }
  }
}
