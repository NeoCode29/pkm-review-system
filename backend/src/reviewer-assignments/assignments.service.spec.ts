import { Test, TestingModule } from '@nestjs/testing';
import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { AssignmentsService } from './assignments.service';
import { PrismaService } from '../prisma/prisma.service';

const mockTx = {
  reviewerAssignment: { create: jest.fn() },
};

const mockPrisma = {
  proposal: { findUnique: jest.fn() },
  reviewerUser: { findMany: jest.fn(), findUnique: jest.fn() },
  reviewerAssignment: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    delete: jest.fn(),
  },
  systemConfig: { findUnique: jest.fn() },
  $transaction: jest.fn((cb) => cb(mockTx)),
};

describe('AssignmentsService', () => {
  let service: AssignmentsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AssignmentsService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<AssignmentsService>(AssignmentsService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('assign', () => {
    it('should throw if same reviewer', async () => {
      await expect(
        service.assign({ proposalId: '1', reviewerIds: ['1', '1'] }, 'admin'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw if proposal not found', async () => {
      mockPrisma.proposal.findUnique.mockResolvedValueOnce(null);
      await expect(
        service.assign({ proposalId: '99', reviewerIds: ['1', '2'] }, 'admin'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw if reviewers not found', async () => {
      mockPrisma.proposal.findUnique.mockResolvedValueOnce({ id: 1n });
      mockPrisma.reviewerUser.findMany.mockResolvedValueOnce([{ id: 1n }]); // only 1 found
      await expect(
        service.assign({ proposalId: '1', reviewerIds: ['1', '2'] }, 'admin'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw if already assigned', async () => {
      mockPrisma.proposal.findUnique.mockResolvedValueOnce({ id: 1n });
      mockPrisma.reviewerUser.findMany.mockResolvedValueOnce([{ id: 1n }, { id: 2n }]);
      mockPrisma.reviewerAssignment.findMany.mockResolvedValueOnce([{ id: 1n }]);
      await expect(
        service.assign({ proposalId: '1', reviewerIds: ['1', '2'] }, 'admin'),
      ).rejects.toThrow(ConflictException);
    });

    it('should assign 2 reviewers in transaction', async () => {
      mockPrisma.proposal.findUnique.mockResolvedValueOnce({ id: 1n });
      mockPrisma.reviewerUser.findMany.mockResolvedValueOnce([{ id: 1n }, { id: 2n }]);
      mockPrisma.reviewerAssignment.findMany.mockResolvedValueOnce([]);
      mockTx.reviewerAssignment.create
        .mockResolvedValueOnce({ id: 1n, reviewerNumber: 1 })
        .mockResolvedValueOnce({ id: 2n, reviewerNumber: 2 });

      const result = await service.assign(
        { proposalId: '1', reviewerIds: ['1', '2'] },
        'admin',
      );
      expect(result).toHaveLength(2);
    });
  });

  describe('bulkAssign', () => {
    it('should return results for each assignment', async () => {
      mockPrisma.proposal.findUnique.mockResolvedValue(null);
      const result = await service.bulkAssign(
        { assignments: [{ proposalId: '1', reviewerIds: ['1', '2'] }] },
        'admin',
      );
      expect(result).toHaveLength(1);
      expect(result[0].status).toBe('error');
    });
  });

  describe('getMyAssignments', () => {
    it('should throw if reviewer not found', async () => {
      mockPrisma.reviewerUser.findUnique.mockResolvedValueOnce(null);
      await expect(service.getMyAssignments('u1')).rejects.toThrow(NotFoundException);
    });

    it('should return assignments', async () => {
      mockPrisma.reviewerUser.findUnique.mockResolvedValueOnce({ id: 1n });
      mockPrisma.reviewerAssignment.findMany.mockResolvedValueOnce([{ id: 1n }]);
      const result = await service.getMyAssignments('u1');
      expect(result).toHaveLength(1);
    });
  });

  describe('unassign', () => {
    it('should throw if not found', async () => {
      mockPrisma.reviewerAssignment.findUnique.mockResolvedValueOnce(null);
      await expect(service.unassign(99n)).rejects.toThrow(NotFoundException);
    });

    it('should throw if review already submitted', async () => {
      mockPrisma.reviewerAssignment.findUnique.mockResolvedValueOnce({
        id: 1n,
        penilaianAdministrasi: { id: 1n },
        penilaianSubstansi: null,
      });
      await expect(service.unassign(1n)).rejects.toThrow(BadRequestException);
    });

    it('should delete assignment', async () => {
      mockPrisma.reviewerAssignment.findUnique.mockResolvedValueOnce({
        id: 1n,
        penilaianAdministrasi: null,
        penilaianSubstansi: null,
      });
      mockPrisma.systemConfig.findUnique.mockResolvedValueOnce(null);
      mockPrisma.reviewerAssignment.delete.mockResolvedValueOnce({ id: 1n });

      await service.unassign(1n);
      expect(mockPrisma.reviewerAssignment.delete).toHaveBeenCalledWith({ where: { id: 1n } });
    });
  });
});
