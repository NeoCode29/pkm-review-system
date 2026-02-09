import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AssignReviewersDto, BulkAssignDto } from './dto/assignment.dto';

@Injectable()
export class AssignmentsService {
  constructor(private readonly prisma: PrismaService) {}

  async assign(dto: AssignReviewersDto, adminUserId: string) {
    const proposalId = BigInt(dto.proposalId);
    const [reviewerId1, reviewerId2] = dto.reviewerIds.map((id) => BigInt(id));

    // Validate not same reviewer
    if (reviewerId1 === reviewerId2) {
      throw new BadRequestException('Kedua reviewer harus berbeda');
    }

    // Validate proposal exists and is submitted
    const proposal = await this.prisma.proposal.findUnique({
      where: { id: proposalId },
    });
    if (!proposal) {
      throw new NotFoundException('Proposal tidak ditemukan');
    }

    // Validate reviewers exist
    const reviewers = await this.prisma.reviewerUser.findMany({
      where: { id: { in: [reviewerId1, reviewerId2] } },
    });
    if (reviewers.length !== 2) {
      throw new BadRequestException('Satu atau kedua reviewer tidak ditemukan');
    }

    // Check existing assignments
    const existingAssignments = await this.prisma.reviewerAssignment.findMany({
      where: { proposalId },
    });
    if (existingAssignments.length > 0) {
      throw new ConflictException('Proposal sudah memiliki reviewer yang di-assign');
    }

    // Create 2 assignments in transaction
    return this.prisma.$transaction(async (tx) => {
      const assignment1 = await tx.reviewerAssignment.create({
        data: {
          proposalId,
          reviewerUserId: reviewerId1,
          reviewerNumber: 1,
          assignedBy: adminUserId,
        },
      });
      const assignment2 = await tx.reviewerAssignment.create({
        data: {
          proposalId,
          reviewerUserId: reviewerId2,
          reviewerNumber: 2,
          assignedBy: adminUserId,
        },
      });
      return [assignment1, assignment2];
    });
  }

  async bulkAssign(dto: BulkAssignDto, adminUserId: string) {
    const results: any[] = [];
    for (const assignment of dto.assignments) {
      try {
        const result = await this.assign(assignment, adminUserId);
        results.push({ proposalId: assignment.proposalId, status: 'success', data: result });
      } catch (error: any) {
        results.push({ proposalId: assignment.proposalId, status: 'error', message: error.message });
      }
    }
    return results;
  }

  async getMyAssignments(userId: string) {
    const reviewer = await this.prisma.reviewerUser.findUnique({
      where: { userId },
    });
    if (!reviewer) {
      throw new NotFoundException('Reviewer profile tidak ditemukan');
    }

    return this.prisma.reviewerAssignment.findMany({
      where: { reviewerUserId: reviewer.id },
      include: {
        proposal: {
          include: {
            team: { select: { id: true, namaTeam: true, judulProposal: true } },
            proposalFiles: { orderBy: { uploadedAt: 'desc' }, take: 1 },
          },
        },
        penilaianAdministrasi: { select: { id: true, isComplete: true } },
        penilaianSubstansi: { select: { id: true, isComplete: true } },
      },
      orderBy: { assignedAt: 'desc' },
    });
  }

  async findByProposal(proposalId: bigint) {
    return this.prisma.reviewerAssignment.findMany({
      where: { proposalId },
      include: {
        reviewerUser: { select: { id: true, nama: true, email: true } },
        penilaianAdministrasi: { select: { id: true, isComplete: true, totalKesalahan: true } },
        penilaianSubstansi: { select: { id: true, isComplete: true, totalSkor: true } },
      },
      orderBy: { reviewerNumber: 'asc' },
    });
  }

  async unassign(id: bigint) {
    const assignment = await this.prisma.reviewerAssignment.findUnique({
      where: { id },
      include: { penilaianAdministrasi: true, penilaianSubstansi: true },
    });
    if (!assignment) {
      throw new NotFoundException('Assignment tidak ditemukan');
    }

    // Check if review already submitted
    if (assignment.penilaianAdministrasi || assignment.penilaianSubstansi) {
      throw new BadRequestException('Tidak bisa unassign reviewer yang sudah memberikan penilaian');
    }

    // Check toggle
    const toggle = await this.prisma.systemConfig.findUnique({
      where: { configKey: 'reviewEnabled' },
    });
    if (toggle && (toggle.configValue as any)?.enabled) {
      throw new BadRequestException('Tidak bisa unassign saat review sedang berlangsung');
    }

    return this.prisma.reviewerAssignment.delete({ where: { id } });
  }
}
