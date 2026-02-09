import { Test, TestingModule } from '@nestjs/testing';
import {
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PenilaianAdministrasiService } from './penilaian-administrasi.service';
import { PrismaService } from '../prisma/prisma.service';

const mockTx = {
  penilaianAdministrasi: { create: jest.fn(), update: jest.fn(), findUnique: jest.fn() },
  detailPenilaianAdministrasi: { create: jest.fn(), deleteMany: jest.fn() },
};

const mockPrisma = {
  reviewerAssignment: { findUnique: jest.fn(), findMany: jest.fn() },
  penilaianAdministrasi: { findUnique: jest.fn() },
  proposal: { findUnique: jest.fn() },
  kriteriaAdministrasi: { findMany: jest.fn() },
  systemConfig: { findUnique: jest.fn() },
  $transaction: jest.fn((cb) => cb(mockTx)),
};

describe('PenilaianAdministrasiService', () => {
  let service: PenilaianAdministrasiService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PenilaianAdministrasiService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<PenilaianAdministrasiService>(PenilaianAdministrasiService);
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
        service.submit(99n, { checklist: [] }, 'u1'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw if user is not the assigned reviewer', async () => {
      mockPrisma.reviewerAssignment.findUnique.mockResolvedValueOnce({
        id: 1n,
        reviewerUser: { userId: 'other-user' },
      });
      await expect(
        service.submit(1n, { checklist: [] }, 'u1'),
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
        service.submit(1n, { checklist: [] }, 'u1'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw if already submitted', async () => {
      mockPrisma.reviewerAssignment.findUnique.mockResolvedValueOnce({
        id: 1n,
        proposalId: 1n,
        reviewerUser: { userId: 'u1' },
      });
      mockPrisma.systemConfig.findUnique.mockResolvedValueOnce(null);
      mockPrisma.penilaianAdministrasi.findUnique.mockResolvedValueOnce({ id: 1n });
      await expect(
        service.submit(1n, { checklist: [] }, 'u1'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should submit penilaian with checklist', async () => {
      mockPrisma.reviewerAssignment.findUnique.mockResolvedValueOnce({
        id: 1n,
        proposalId: 1n,
        reviewerUser: { userId: 'u1' },
      });
      mockPrisma.systemConfig.findUnique.mockResolvedValueOnce(null);
      mockPrisma.penilaianAdministrasi.findUnique
        .mockResolvedValueOnce(null) // not yet submitted
        .mockResolvedValueOnce({ id: 1n, totalKesalahan: 1 }); // getByAssignment
      mockPrisma.proposal.findUnique.mockResolvedValueOnce({
        id: 1n,
        team: { jenisPkmId: 1n },
      });
      mockPrisma.kriteriaAdministrasi.findMany.mockResolvedValueOnce([]);
      mockTx.penilaianAdministrasi.create.mockResolvedValueOnce({ id: 1n });
      mockTx.penilaianAdministrasi.findUnique.mockResolvedValueOnce({ id: 1n, totalKesalahan: 1 });

      const result = await service.submit(1n, {
        checklist: [{ kriteriaAdministrasiId: '1', adaKesalahan: true }],
      }, 'u1');
      expect(mockPrisma.$transaction).toHaveBeenCalled();
    });
  });

  describe('update', () => {
    it('should update existing penilaian', async () => {
      mockPrisma.reviewerAssignment.findUnique.mockResolvedValueOnce({
        id: 1n,
        reviewerUser: { userId: 'u1' },
      });
      mockPrisma.systemConfig.findUnique.mockResolvedValueOnce(null);
      mockPrisma.penilaianAdministrasi.findUnique.mockResolvedValueOnce({ id: 1n });
      mockTx.penilaianAdministrasi.update.mockResolvedValueOnce({ id: 1n });
      mockTx.detailPenilaianAdministrasi.deleteMany.mockResolvedValueOnce({});
      mockTx.penilaianAdministrasi.findUnique.mockResolvedValueOnce({ id: 1n, totalKesalahan: 0 });

      await service.update(1n, { checklist: [] }, 'u1');
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
        service.update(1n, { checklist: [] }, 'u1'),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('getByAssignment', () => {
    it('should return penilaian data', async () => {
      mockPrisma.penilaianAdministrasi.findUnique.mockResolvedValueOnce({
        id: 1n,
        totalKesalahan: 2,
        detailPenilaianAdministrasi: [],
      });
      const result = await service.getByAssignment(1n);
      expect(result).toBeDefined();
    });
  });

  describe('getErrorUnion', () => {
    it('should combine errors from both reviewers (union)', async () => {
      mockPrisma.reviewerAssignment.findMany.mockResolvedValueOnce([
        {
          penilaianAdministrasi: {
            detailPenilaianAdministrasi: [
              { adaKesalahan: true, kriteriaAdministrasiId: 1n, kriteriaAdministrasi: { id: 1n, deskripsi: 'Format salah', urutan: 1 } },
              { adaKesalahan: false, kriteriaAdministrasiId: 2n, kriteriaAdministrasi: { id: 2n, deskripsi: 'Lengkap', urutan: 2 } },
            ],
          },
        },
        {
          penilaianAdministrasi: {
            detailPenilaianAdministrasi: [
              { adaKesalahan: false, kriteriaAdministrasiId: 1n, kriteriaAdministrasi: { id: 1n, deskripsi: 'Format salah', urutan: 1 } },
              { adaKesalahan: true, kriteriaAdministrasiId: 2n, kriteriaAdministrasi: { id: 2n, deskripsi: 'Lengkap', urutan: 2 } },
            ],
          },
        },
      ]);

      const result = await service.getErrorUnion(1n);
      // Both criteria have errors (union: reviewer 1 flagged #1, reviewer 2 flagged #2)
      expect(result.totalKesalahan).toBe(2);
      expect(result.errors).toHaveLength(2);
    });

    it('should return 0 errors when no reviewer flagged errors', async () => {
      mockPrisma.reviewerAssignment.findMany.mockResolvedValueOnce([
        {
          penilaianAdministrasi: {
            detailPenilaianAdministrasi: [
              { adaKesalahan: false, kriteriaAdministrasiId: 1n, kriteriaAdministrasi: { id: 1n, deskripsi: 'OK', urutan: 1 } },
            ],
          },
        },
      ]);

      const result = await service.getErrorUnion(1n);
      expect(result.totalKesalahan).toBe(0);
    });
  });
});
