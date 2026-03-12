import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class MigrationService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Fix missing skor values by recalculating from totalSkor
   * This assumes all kriteria have the same skor (approximation)
   * Better solution: have reviewers re-submit
   */
  async fixMissingSkor(proposalId: bigint) {
    const assignments = await this.prisma.reviewerAssignment.findMany({
      where: { proposalId },
      include: {
        penilaianSubstansi: {
          include: {
            detailPenilaianSubstansi: {
              include: {
                kriteriaSubstansi: { select: { bobot: true } },
              },
            },
          },
        },
      },
    });

    const results: Array<{
      assignmentId: string;
      reviewerNumber: number;
      totalSkor: number;
      estimatedSkor: string;
      detailsUpdated: number;
    }> = [];

    for (const assignment of assignments) {
      const penilaian = assignment.penilaianSubstansi;
      if (!penilaian) continue;

      const totalSkor = Number(penilaian.totalSkor);
      const details = penilaian.detailPenilaianSubstansi;
      
      if (details.length === 0) continue;

      // Calculate average skor that would produce this totalSkor
      const totalBobot = details.reduce((sum, d) => sum + d.kriteriaSubstansi.bobot, 0);
      const estimatedSkor = totalBobot > 0 ? totalSkor / totalBobot : 0;

      // Update all details with estimated skor
      for (const detail of details) {
        if (Number(detail.skor) === 0) {
          await this.prisma.detailPenilaianSubstansi.update({
            where: { id: detail.id },
            data: { skor: estimatedSkor },
          });
        }
      }

      results.push({
        assignmentId: assignment.id.toString(),
        reviewerNumber: assignment.reviewerNumber,
        totalSkor,
        estimatedSkor: estimatedSkor.toFixed(2),
        detailsUpdated: details.filter(d => Number(d.skor) === 0).length,
      });
    }

    return {
      message: 'Skor values estimated from totalSkor. Note: This is an approximation.',
      proposalId: proposalId.toString(),
      results,
    };
  }
}
