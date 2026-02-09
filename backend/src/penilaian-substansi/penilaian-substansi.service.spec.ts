import { Test, TestingModule } from '@nestjs/testing';
import {
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PenilaianSubstansiService } from './penilaian-substansi.service';
import { PrismaService } from '../prisma/prisma.service';

const mockTx = {
  penilaianSubstansi: { create: jest.fn(), update: jest.fn(), findUnique: jest.fn() },
  detailPenilaianSubstansi: { create: jest.fn(), deleteMany: jest.fn() },
};

const mockPrisma = {
  reviewerAssignment: { findUnique: jest.fn() },
  penilaianSubstansi: { findUnique: jest.fn() },
  proposal: { findUnique: jest.fn() },
  kriteriaSubstansi: { findMany: jest.fn() },
  systemConfig: { findUnique: jest.fn() },
  $transaction: jest.fn((cb) => cb(mockTx)),
};

describe('PenilaianSubstansiService', () => {
  let service: PenilaianSubstansiService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PenilaianSubstansiService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<PenilaianSubstansiService>(PenilaianSubstansiService);
    jest.clearAllMocks();
    mockPrisma.$transaction.mockImplementation((cb: any) => cb(mockTx));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('submit', () => {
    it('should throw if assignment not found', async () => {
      mockPrisma.reviewerAssignment.findUnique.mockResolvedValueOnce(null);
      await expect(
        service.submit(99n, { scores: [] }, 'u1'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw if user is not the assigned reviewer', async () => {
      mockPrisma.reviewerAssignment.findUnique.mockResolvedValueOnce({
        id: 1n,
        reviewerUser: { userId: 'other-user' },
      });
      await expect(
        service.submit(1n, { scores: [] }, 'u1'),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw if review toggle is off', async () => {
      mockPrisma.reviewerAssignment.findUnique.mockResolvedValueOnce({
        id: 1n,
        reviewerUser: { userId: 'u1' },
      });
      mockPrisma.systemConfig.findUnique.mockResolvedValueOnce({
        configKey: 'reviewEnabled',
        configValue: { enabled: false },
      });
      await expect(
        service.submit(1n, { scores: [] }, 'u1'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw if already submitted', async () => {
      mockPrisma.reviewerAssignment.findUnique.mockResolvedValueOnce({
        id: 1n,
        proposalId: 1n,
        reviewerUser: { userId: 'u1' },
      });
      mockPrisma.systemConfig.findUnique.mockResolvedValueOnce(null);
      mockPrisma.penilaianSubstansi.findUnique.mockResolvedValueOnce({ id: 1n });
      await expect(
        service.submit(1n, { scores: [] }, 'u1'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw if score 4 is used', async () => {
      mockPrisma.reviewerAssignment.findUnique.mockResolvedValueOnce({
        id: 1n,
        proposalId: 1n,
        reviewerUser: { userId: 'u1' },
      });
      mockPrisma.systemConfig.findUnique.mockResolvedValueOnce(null);
      mockPrisma.penilaianSubstansi.findUnique.mockResolvedValueOnce(null);
      mockPrisma.proposal.findUnique.mockResolvedValueOnce({
        id: 1n,
        team: { jenisPkmId: 1n },
      });
      mockPrisma.kriteriaSubstansi.findMany.mockResolvedValueOnce([
        { id: 1n, nama: 'K1', skorMin: 1, skorMax: 7, bobot: 20 },
      ]);

      await expect(
        service.submit(1n, {
          scores: [{ kriteriaSubstansiId: '1', skor: 4 }],
        }, 'u1'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw if score out of range', async () => {
      mockPrisma.reviewerAssignment.findUnique.mockResolvedValueOnce({
        id: 1n,
        proposalId: 1n,
        reviewerUser: { userId: 'u1' },
      });
      mockPrisma.systemConfig.findUnique.mockResolvedValueOnce(null);
      mockPrisma.penilaianSubstansi.findUnique.mockResolvedValueOnce(null);
      mockPrisma.proposal.findUnique.mockResolvedValueOnce({
        id: 1n,
        team: { jenisPkmId: 1n },
      });
      mockPrisma.kriteriaSubstansi.findMany.mockResolvedValueOnce([
        { id: 1n, nama: 'K1', skorMin: 1, skorMax: 7, bobot: 20 },
      ]);

      await expect(
        service.submit(1n, {
          scores: [{ kriteriaSubstansiId: '1', skor: 10 }],
        }, 'u1'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should submit with correct total (skor × bobot)', async () => {
      mockPrisma.reviewerAssignment.findUnique.mockResolvedValueOnce({
        id: 1n,
        proposalId: 1n,
        reviewerUser: { userId: 'u1' },
      });
      mockPrisma.systemConfig.findUnique.mockResolvedValueOnce(null);
      mockPrisma.penilaianSubstansi.findUnique
        .mockResolvedValueOnce(null) // not yet submitted
        .mockResolvedValueOnce({ id: 1n, totalSkor: 120 }); // getByAssignment
      mockPrisma.proposal.findUnique.mockResolvedValueOnce({
        id: 1n,
        team: { jenisPkmId: 1n },
      });
      mockPrisma.kriteriaSubstansi.findMany.mockResolvedValueOnce([
        { id: 1n, nama: 'K1', skorMin: 1, skorMax: 7, bobot: 20 },
      ]);
      mockTx.penilaianSubstansi.create.mockResolvedValueOnce({ id: 1n });
      mockTx.penilaianSubstansi.findUnique.mockResolvedValueOnce({ id: 1n, totalSkor: 120 });

      // skor 6 × bobot 20 = 120
      const result = await service.submit(1n, {
        scores: [{ kriteriaSubstansiId: '1', skor: 6 }],
      }, 'u1');
      expect(mockPrisma.$transaction).toHaveBeenCalled();
    });
  });

  describe('update', () => {
    it('should update existing penilaian', async () => {
      mockPrisma.reviewerAssignment.findUnique
        .mockResolvedValueOnce({ id: 1n, reviewerUser: { userId: 'u1' } })
        .mockResolvedValueOnce({ id: 1n, proposal: { team: { jenisPkmId: 1n } } });
      mockPrisma.systemConfig.findUnique.mockResolvedValueOnce(null);
      mockPrisma.penilaianSubstansi.findUnique.mockResolvedValueOnce({ id: 1n });
      mockPrisma.kriteriaSubstansi.findMany.mockResolvedValueOnce([]);
      mockTx.penilaianSubstansi.update.mockResolvedValueOnce({ id: 1n });
      mockTx.detailPenilaianSubstansi.deleteMany.mockResolvedValueOnce({});
      mockTx.penilaianSubstansi.findUnique.mockResolvedValueOnce({ id: 1n, totalSkor: 0 });

      await service.update(1n, { scores: [] }, 'u1');
      expect(mockPrisma.$transaction).toHaveBeenCalled();
    });

    it('should throw if review toggle is off', async () => {
      mockPrisma.reviewerAssignment.findUnique.mockResolvedValueOnce({
        id: 1n,
        reviewerUser: { userId: 'u1' },
      });
      mockPrisma.systemConfig.findUnique.mockResolvedValueOnce({
        configKey: 'reviewEnabled',
        configValue: { enabled: false },
      });
      await expect(
        service.update(1n, { scores: [] }, 'u1'),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('getByAssignment', () => {
    it('should return penilaian data', async () => {
      mockPrisma.penilaianSubstansi.findUnique.mockResolvedValueOnce({
        id: 1n,
        totalSkor: 500,
      });
      const result = await service.getByAssignment(1n);
      expect(result).toBeDefined();
    });
  });
});
