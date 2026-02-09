import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SubmitPenilaianSubstansiDto } from './dto/penilaian-substansi.dto';
import { Decimal } from '@prisma/client/runtime/library';

@Injectable()
export class PenilaianSubstansiService {
  constructor(private readonly prisma: PrismaService) {}

  async submit(assignmentId: bigint, dto: SubmitPenilaianSubstansiDto, userId: string) {
    const assignment = await this.validateAssignment(assignmentId, userId);

    // Check review toggle
    await this.checkReviewToggle();

    // Check not already submitted
    const existing = await this.prisma.penilaianSubstansi.findUnique({
      where: { reviewerAssignmentId: assignmentId },
    });
    if (existing) {
      throw new BadRequestException('Penilaian substansi sudah disubmit. Gunakan PUT untuk update.');
    }

    // Get kriteria for validation
    const proposal = await this.prisma.proposal.findUnique({
      where: { id: assignment.proposalId },
      include: { team: { select: { jenisPkmId: true } } },
    });
    if (!proposal) throw new NotFoundException('Proposal tidak ditemukan');

    const kriteriaList = await this.prisma.kriteriaSubstansi.findMany({
      where: { jenisPkmId: proposal.team.jenisPkmId },
    });

    // Validate scores and calculate total
    const totalSkor = await this.calculateTotalSkor(dto.scores, kriteriaList);

    return this.prisma.$transaction(async (tx) => {
      const penilaian = await tx.penilaianSubstansi.create({
        data: {
          reviewerAssignmentId: assignmentId,
          totalSkor: new Decimal(totalSkor),
          catatan: dto.catatan,
          isComplete: true,
        },
      });

      for (const item of dto.scores) {
        await tx.detailPenilaianSubstansi.create({
          data: {
            penilaianSubstansiId: penilaian.id,
            kriteriaSubstansiId: BigInt(item.kriteriaSubstansiId),
            skor: new Decimal(item.skor),
          },
        });
      }

      return this.getByAssignment(assignmentId, tx);
    });
  }

  async update(assignmentId: bigint, dto: SubmitPenilaianSubstansiDto, userId: string) {
    await this.validateAssignment(assignmentId, userId);
    await this.checkReviewToggle();

    const existing = await this.prisma.penilaianSubstansi.findUnique({
      where: { reviewerAssignmentId: assignmentId },
    });
    if (!existing) {
      throw new NotFoundException('Penilaian substansi belum disubmit');
    }

    const assignment = await this.prisma.reviewerAssignment.findUnique({
      where: { id: assignmentId },
      include: { proposal: { include: { team: { select: { jenisPkmId: true } } } } },
    });
    const kriteriaList = await this.prisma.kriteriaSubstansi.findMany({
      where: { jenisPkmId: assignment!.proposal.team.jenisPkmId },
    });

    const totalSkor = await this.calculateTotalSkor(dto.scores, kriteriaList);

    return this.prisma.$transaction(async (tx) => {
      await tx.penilaianSubstansi.update({
        where: { id: existing.id },
        data: { totalSkor: new Decimal(totalSkor), catatan: dto.catatan },
      });

      await tx.detailPenilaianSubstansi.deleteMany({
        where: { penilaianSubstansiId: existing.id },
      });

      for (const item of dto.scores) {
        await tx.detailPenilaianSubstansi.create({
          data: {
            penilaianSubstansiId: existing.id,
            kriteriaSubstansiId: BigInt(item.kriteriaSubstansiId),
            skor: new Decimal(item.skor),
          },
        });
      }

      return this.getByAssignment(assignmentId, tx);
    });
  }

  async getByAssignment(assignmentId: bigint, prismaClient?: any) {
    const client = prismaClient || this.prisma;
    return client.penilaianSubstansi.findUnique({
      where: { reviewerAssignmentId: assignmentId },
      include: {
        detailPenilaianSubstansi: {
          include: {
            kriteriaSubstansi: {
              select: { id: true, nama: true, deskripsi: true, skorMin: true, skorMax: true, bobot: true, urutan: true },
            },
          },
          orderBy: { kriteriaSubstansi: { urutan: 'asc' } },
        },
      },
    });
  }

  // nilai = skor × bobot, totalNilai = SUM(all nilai)
  private async calculateTotalSkor(
    scores: { kriteriaSubstansiId: string; skor: number }[],
    kriteriaList: any[],
  ): Promise<number> {
    let totalNilai = 0;

    for (const item of scores) {
      const kriteria = kriteriaList.find((k) => k.id === BigInt(item.kriteriaSubstansiId));
      if (!kriteria) {
        throw new BadRequestException(`Kriteria substansi ${item.kriteriaSubstansiId} tidak ditemukan`);
      }

      // Validate score range
      if (item.skor < kriteria.skorMin || item.skor > kriteria.skorMax) {
        throw new BadRequestException(
          `Skor untuk "${kriteria.nama}" harus antara ${kriteria.skorMin} dan ${kriteria.skorMax}`,
        );
      }

      // Score 4 is skipped (1=Buruk, 2=Sangat kurang, 3=Kurang, 5=Cukup, 6=Baik, 7=Sangat baik)
      if (item.skor === 4) {
        throw new BadRequestException('Skor 4 tidak diperbolehkan (skipped)');
      }

      // nilai = skor × bobot
      totalNilai += item.skor * kriteria.bobot;
    }

    return totalNilai;
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
