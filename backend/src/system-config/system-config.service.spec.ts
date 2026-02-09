import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { SystemConfigService } from './system-config.service';
import { PrismaService } from '../prisma/prisma.service';

const mockTx = {
  systemConfig: { upsert: jest.fn(), findMany: jest.fn() },
  proposal: { updateMany: jest.fn(), findMany: jest.fn(), update: jest.fn() },
};

const mockPrisma = {
  systemConfig: { findMany: jest.fn(), findUnique: jest.fn() },
  $transaction: jest.fn((cb: any) => cb(mockTx)),
};

describe('SystemConfigService', () => {
  let service: SystemConfigService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SystemConfigService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<SystemConfigService>(SystemConfigService);
    jest.clearAllMocks();
    mockPrisma.$transaction.mockImplementation((cb: any) => cb(mockTx));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getAllToggles', () => {
    it('should return all toggle states', async () => {
      mockPrisma.systemConfig.findMany.mockResolvedValueOnce([
        { configKey: 'uploadProposalEnabled', configValue: { enabled: true } },
        { configKey: 'reviewEnabled', configValue: { enabled: false } },
      ]);
      const result = await service.getAllToggles();
      expect(result.uploadProposalEnabled).toBe(true);
      expect(result.reviewEnabled).toBe(false);
      expect(result.uploadRevisionEnabled).toBe(false);
    });

    it('should default to false if config not found', async () => {
      mockPrisma.systemConfig.findMany.mockResolvedValueOnce([]);
      const result = await service.getAllToggles();
      expect(result.uploadProposalEnabled).toBe(false);
    });
  });

  describe('getToggle', () => {
    it('should throw for invalid key', async () => {
      await expect(service.getToggle('invalidKey')).rejects.toThrow(BadRequestException);
    });

    it('should return toggle state', async () => {
      mockPrisma.systemConfig.findUnique.mockResolvedValueOnce({
        configKey: 'reviewEnabled',
        configValue: { enabled: true },
      });
      const result = await service.getToggle('reviewEnabled');
      expect(result.enabled).toBe(true);
    });
  });

  describe('updateToggle', () => {
    it('should throw for invalid key', async () => {
      await expect(service.updateToggle('bad', true, 'admin')).rejects.toThrow(BadRequestException);
    });

    it('should turn off others when enabling a toggle', async () => {
      mockTx.systemConfig.upsert.mockResolvedValue({});
      mockTx.systemConfig.findMany.mockResolvedValueOnce([
        { configKey: 'uploadProposalEnabled', configValue: { enabled: true } },
        { configKey: 'reviewEnabled', configValue: { enabled: false } },
        { configKey: 'uploadRevisionEnabled', configValue: { enabled: false } },
      ]);

      const result = await service.updateToggle('uploadProposalEnabled', true, 'admin');
      // Should call upsert 3 times: 2 for turning off others + 1 for target
      expect(mockTx.systemConfig.upsert).toHaveBeenCalledTimes(3);
    });

    it('should trigger submitted+revised→under_review when reviewEnabled ON', async () => {
      mockTx.systemConfig.upsert.mockResolvedValue({});
      mockTx.proposal.updateMany.mockResolvedValue({ count: 5 });
      mockTx.systemConfig.findMany.mockResolvedValueOnce([]);

      await service.updateToggle('reviewEnabled', true, 'admin');
      // submitted → under_review
      expect(mockTx.proposal.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { status: 'submitted' },
          data: { status: 'under_review' },
        }),
      );
      // revised → under_review (unlimited revision cycles)
      expect(mockTx.proposal.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { status: 'revised' },
          data: { status: 'under_review' },
        }),
      );
    });

    it('should finalize reviews: ≥1 complete = reviewed, 0 = not_reviewed', async () => {
      mockTx.systemConfig.upsert.mockResolvedValue({});
      mockTx.proposal.findMany.mockResolvedValueOnce([
        {
          id: 1n,
          reviewerAssignments: [
            { penilaianAdministrasi: { isComplete: true }, penilaianSubstansi: { isComplete: true } },
            { penilaianAdministrasi: { isComplete: false }, penilaianSubstansi: null },
          ],
        },
        {
          id: 2n,
          reviewerAssignments: [
            { penilaianAdministrasi: { isComplete: false }, penilaianSubstansi: null },
          ],
        },
      ]);
      mockTx.proposal.update.mockResolvedValue({});
      mockTx.systemConfig.findMany.mockResolvedValueOnce([]);

      await service.updateToggle('reviewEnabled', false, 'admin');
      // Proposal 1: 1 complete review → reviewed
      expect(mockTx.proposal.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 1n },
          data: { status: 'reviewed' },
        }),
      );
      // Proposal 2: 0 complete reviews → not_reviewed
      expect(mockTx.proposal.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 2n },
          data: { status: 'not_reviewed' },
        }),
      );
    });

    it('should trigger reviewed→needs_revision when uploadRevisionEnabled ON', async () => {
      mockTx.systemConfig.upsert.mockResolvedValue({});
      mockTx.proposal.updateMany.mockResolvedValue({ count: 3 });
      mockTx.systemConfig.findMany.mockResolvedValueOnce([]);

      await service.updateToggle('uploadRevisionEnabled', true, 'admin');
      expect(mockTx.proposal.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { status: 'reviewed' },
          data: { status: 'needs_revision' },
        }),
      );
    });
  });
});
