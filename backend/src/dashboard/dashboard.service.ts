import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

const TOGGLE_KEYS = ['uploadProposalEnabled', 'reviewEnabled', 'uploadRevisionEnabled'];

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getAdminDashboard() {
    // Toggle states
    const configs = await this.prisma.systemConfig.findMany({
      where: { configKey: { in: TOGGLE_KEYS } },
    });
    const toggleStates: Record<string, boolean> = {};
    for (const key of TOGGLE_KEYS) {
      const config = configs.find((c) => c.configKey === key);
      toggleStates[key] = config ? (config.configValue as any)?.enabled ?? false : false;
    }

    // Detect current phase
    let currentPhase = 'CLOSED';
    if (toggleStates.uploadProposalEnabled) currentPhase = 'SUBMISSION';
    else if (toggleStates.reviewEnabled) currentPhase = 'REVIEW';
    else if (toggleStates.uploadRevisionEnabled) currentPhase = 'REVISION';

    // Stats (only original proposals)
    const [totalMahasiswa, totalReviewers, totalTeams, totalProposals] = await Promise.all([
      this.prisma.mahasiswa.count(),
      this.prisma.reviewerUser.count(),
      this.prisma.team.count({ where: { status: 'active' } }),
      this.prisma.proposal.count({ where: { type: 'original' } }),
    ]);

    // Proposals by status (only original)
    const proposalStatuses = ['draft', 'submitted', 'under_review', 'reviewed', 'not_reviewed', 'needs_revision'];
    const proposalsByStatus: Record<string, { count: number; percentage: number }> = {};
    for (const status of proposalStatuses) {
      const count = await this.prisma.proposal.count({ where: { status: status as any, type: 'original' } });
      proposalsByStatus[status] = {
        count,
        percentage: totalProposals > 0 ? Math.round((count / totalProposals) * 1000) / 10 : 0,
      };
    }

    // Reviewer progress
    const reviewers = await this.prisma.reviewerUser.findMany({
      select: {
        id: true,
        nama: true,
        reviewerAssignments: {
          select: {
            penilaianAdministrasi: { select: { isComplete: true } },
            penilaianSubstansi: { select: { isComplete: true } },
          },
        },
      },
      orderBy: { nama: 'asc' },
    });

    const reviewerProgress = reviewers.map((r) => {
      const total = r.reviewerAssignments.length;
      const completed = r.reviewerAssignments.filter(
        (a) => a.penilaianAdministrasi?.isComplete && a.penilaianSubstansi?.isComplete,
      ).length;
      return { id: r.id.toString(), nama: r.nama, total, completed, pending: total - completed };
    });

    // Proposals by jenis PKM
    const jenisPkmList = await this.prisma.jenisPkm.findMany({
      select: {
        id: true,
        nama: true,
        _count: { select: { teams: true } },
      },
      orderBy: { nama: 'asc' },
    });

    const proposalsByJenisPkm: { id: string; nama: string; count: number }[] = [];
    for (const jp of jenisPkmList) {
      const count = await this.prisma.proposal.count({
        where: { team: { jenisPkmId: jp.id }, type: 'original' },
      });
      proposalsByJenisPkm.push({ id: jp.id.toString(), nama: jp.nama, count });
    }

    return {
      currentPhase,
      toggleStates,
      stats: {
        totalMahasiswa,
        totalReviewers,
        totalTeams,
        totalProposals,
      },
      proposalsByStatus,
      reviewerProgress,
      proposalsByJenisPkm,
    };
  }

  async getReviewerDashboard(userId: string) {
    const reviewer = await this.prisma.reviewerUser.findUnique({
      where: { userId },
    });
    if (!reviewer) {
      throw new NotFoundException('Reviewer profile tidak ditemukan');
    }

    const assignments = await this.prisma.reviewerAssignment.findMany({
      where: { reviewerUserId: reviewer.id },
      include: {
        proposal: {
          select: { id: true, type: true, status: true, team: { select: { id: true, namaTeam: true, judulProposal: true } } },
        },
        penilaianAdministrasi: { select: { isComplete: true } },
        penilaianSubstansi: { select: { isComplete: true } },
      },
    });

    const completed = assignments.filter(
      (a) => a.penilaianAdministrasi?.isComplete && a.penilaianSubstansi?.isComplete,
    ).length;

    return {
      reviewer: { id: reviewer.id, nama: reviewer.nama },
      stats: {
        totalAssigned: assignments.length,
        completed,
        pending: assignments.length - completed,
      },
      assignments,
    };
  }

  async getMahasiswaDashboard(userId: string) {
    const mahasiswa = await this.prisma.mahasiswa.findUnique({
      where: { userId },
      include: {
        teamMembers: {
          include: {
            team: {
              include: {
                jenisPkm: { select: { id: true, nama: true } },
                dosenPembimbing: { select: { id: true, nama: true } },
                teamMembers: {
                  include: {
                    mahasiswa: { select: { id: true, nama: true, nim: true } },
                  },
                },
                proposals: {
                  include: {
                    proposalFiles: { orderBy: { uploadedAt: 'desc' }, take: 1 },
                  },
                },
                _count: { select: { teamMembers: true } },
              },
            },
          },
        },
      },
    });

    if (!mahasiswa) {
      throw new NotFoundException('Mahasiswa tidak ditemukan');
    }

    const teamMember = mahasiswa.teamMembers[0] || null;

    if (teamMember) {
      return {
        layout: 'TEAM_DASHBOARD',
        team: teamMember.team,
        role: teamMember.role,
        proposalStatus: teamMember.team.proposals[0]?.status || 'no_proposal',
      };
    }

    // No team — show open teams preview
    const openTeams = await this.prisma.team.findMany({
      where: { status: 'active', openToJoin: true },
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: {
        jenisPkm: { select: { id: true, nama: true } },
        _count: { select: { teamMembers: true } },
      },
    });

    return {
      layout: 'NO_TEAM',
      openTeamsPreview: openTeams,
    };
  }
}
