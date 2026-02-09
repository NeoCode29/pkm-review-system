import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { PrismaService } from '../prisma/prisma.service';

const mockPrisma = {
  systemConfig: { findMany: jest.fn() },
  mahasiswa: { count: jest.fn(), findUnique: jest.fn() },
  reviewerUser: { count: jest.fn(), findUnique: jest.fn() },
  team: { count: jest.fn(), findMany: jest.fn() },
  proposal: { count: jest.fn() },
  reviewerAssignment: { findMany: jest.fn() },
};

describe('DashboardService', () => {
  let service: DashboardService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DashboardService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<DashboardService>(DashboardService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getAdminDashboard', () => {
    it('should return admin dashboard with SUBMISSION phase', async () => {
      mockPrisma.systemConfig.findMany.mockResolvedValueOnce([
        { configKey: 'uploadProposalEnabled', configValue: { enabled: true } },
      ]);
      mockPrisma.mahasiswa.count.mockResolvedValueOnce(50);
      mockPrisma.reviewerUser.count.mockResolvedValueOnce(10);
      mockPrisma.team.count.mockResolvedValueOnce(15);
      mockPrisma.proposal.count
        .mockResolvedValueOnce(30) // total
        .mockResolvedValue(0); // each status

      const result = await service.getAdminDashboard();
      expect(result.currentPhase).toBe('SUBMISSION');
      expect(result.stats.totalMahasiswa).toBe(50);
    });

    it('should detect REVIEW phase', async () => {
      mockPrisma.systemConfig.findMany.mockResolvedValueOnce([
        { configKey: 'reviewEnabled', configValue: { enabled: true } },
      ]);
      mockPrisma.mahasiswa.count.mockResolvedValueOnce(0);
      mockPrisma.reviewerUser.count.mockResolvedValueOnce(0);
      mockPrisma.team.count.mockResolvedValueOnce(0);
      mockPrisma.proposal.count.mockResolvedValue(0);

      const result = await service.getAdminDashboard();
      expect(result.currentPhase).toBe('REVIEW');
    });

    it('should detect CLOSED phase when no toggles on', async () => {
      mockPrisma.systemConfig.findMany.mockResolvedValueOnce([]);
      mockPrisma.mahasiswa.count.mockResolvedValueOnce(0);
      mockPrisma.reviewerUser.count.mockResolvedValueOnce(0);
      mockPrisma.team.count.mockResolvedValueOnce(0);
      mockPrisma.proposal.count.mockResolvedValue(0);

      const result = await service.getAdminDashboard();
      expect(result.currentPhase).toBe('CLOSED');
    });
  });

  describe('getReviewerDashboard', () => {
    it('should throw if reviewer not found', async () => {
      mockPrisma.reviewerUser.findUnique.mockResolvedValueOnce(null);
      await expect(service.getReviewerDashboard('u1')).rejects.toThrow(NotFoundException);
    });

    it('should return reviewer dashboard with stats', async () => {
      mockPrisma.reviewerUser.findUnique.mockResolvedValueOnce({ id: 1n, nama: 'Dr. R' });
      mockPrisma.reviewerAssignment.findMany.mockResolvedValueOnce([
        { penilaianAdministrasi: { isComplete: true }, penilaianSubstansi: { isComplete: true } },
        { penilaianAdministrasi: { isComplete: false }, penilaianSubstansi: null },
      ]);

      const result = await service.getReviewerDashboard('u1');
      expect(result.stats.totalAssigned).toBe(2);
      expect(result.stats.completed).toBe(1);
      expect(result.stats.pending).toBe(1);
    });
  });

  describe('getMahasiswaDashboard', () => {
    it('should throw if mahasiswa not found', async () => {
      mockPrisma.mahasiswa.findUnique.mockResolvedValueOnce(null);
      await expect(service.getMahasiswaDashboard('u1')).rejects.toThrow(NotFoundException);
    });

    it('should return TEAM_DASHBOARD layout when has team', async () => {
      mockPrisma.mahasiswa.findUnique.mockResolvedValueOnce({
        id: 1n,
        teamMembers: [{
          role: 'ketua',
          team: { id: 1n, proposals: [{ status: 'draft' }], teamMembers: [] },
        }],
      });

      const result = await service.getMahasiswaDashboard('u1');
      expect(result.layout).toBe('TEAM_DASHBOARD');
    });

    it('should return NO_TEAM layout with open teams preview', async () => {
      mockPrisma.mahasiswa.findUnique.mockResolvedValueOnce({
        id: 1n,
        teamMembers: [],
      });
      mockPrisma.team.findMany.mockResolvedValueOnce([{ id: 1n }]);

      const result = await service.getMahasiswaDashboard('u1');
      expect(result.layout).toBe('NO_TEAM');
      expect((result as any).openTeamsPreview).toHaveLength(1);
    });
  });
});
