import { Test, TestingModule } from '@nestjs/testing';
import {
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { ProposalsService } from './proposals.service';
import { PrismaService } from '../prisma/prisma.service';

const mockPrisma = {
  proposal: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn(),
  },
  proposalFile: {
    findMany: jest.fn(),
    create: jest.fn(),
  },
  mahasiswa: { findUnique: jest.fn() },
  systemConfig: { findUnique: jest.fn() },
};

describe('ProposalsService', () => {
  let service: ProposalsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProposalsService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<ProposalsService>(ProposalsService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findOne', () => {
    it('should return proposal by id', async () => {
      mockPrisma.proposal.findUnique.mockResolvedValueOnce({
        id: 1n,
        status: 'draft',
      });
      const result = await service.findOne(1n);
      expect(result.status).toBe('draft');
    });

    it('should throw NotFoundException', async () => {
      mockPrisma.proposal.findUnique.mockResolvedValueOnce(null);
      await expect(service.findOne(99n)).rejects.toThrow(NotFoundException);
    });
  });

  describe('findByTeam', () => {
    it('should return proposals by team', async () => {
      mockPrisma.proposal.findMany.mockResolvedValueOnce([{ id: 1n }, { id: 2n }]);
      const result = await service.findByTeam(1n);
      expect(result).toHaveLength(2);
    });
  });

  describe('submitProposal', () => {
    const mockProposal = {
      id: 1n,
      status: 'draft',
      team: {
        dosenPembimbingId: 1n,
        teamMembers: [{ mahasiswaId: 1n }, { mahasiswaId: 2n }, { mahasiswaId: 3n }],
        _count: { teamMembers: 3 },
      },
      proposalFiles: [{ id: 1n }],
    };

    it('should throw if mahasiswa not found', async () => {
      mockPrisma.proposal.findUnique.mockResolvedValueOnce(mockProposal);
      mockPrisma.mahasiswa.findUnique.mockResolvedValueOnce(null);
      await expect(service.submitProposal(1n, 'u1')).rejects.toThrow(ForbiddenException);
    });

    it('should throw if user not team member', async () => {
      mockPrisma.proposal.findUnique.mockResolvedValueOnce(mockProposal);
      mockPrisma.mahasiswa.findUnique.mockResolvedValueOnce({ id: 99n });
      await expect(service.submitProposal(1n, 'u1')).rejects.toThrow(ForbiddenException);
    });

    it('should throw if team has < 3 members', async () => {
      const smallTeam = {
        ...mockProposal,
        team: {
          ...mockProposal.team,
          teamMembers: [{ mahasiswaId: 1n }],
          _count: { teamMembers: 1 },
        },
      };
      mockPrisma.proposal.findUnique.mockResolvedValueOnce(smallTeam);
      mockPrisma.mahasiswa.findUnique.mockResolvedValueOnce({ id: 1n });
      await expect(service.submitProposal(1n, 'u1')).rejects.toThrow(BadRequestException);
    });

    it('should throw if no dosen pembimbing', async () => {
      const noDosen = {
        ...mockProposal,
        team: { ...mockProposal.team, dosenPembimbingId: null },
      };
      mockPrisma.proposal.findUnique.mockResolvedValueOnce(noDosen);
      mockPrisma.mahasiswa.findUnique.mockResolvedValueOnce({ id: 1n });
      await expect(service.submitProposal(1n, 'u1')).rejects.toThrow(BadRequestException);
    });

    it('should throw if no files uploaded', async () => {
      const noFiles = { ...mockProposal, proposalFiles: [] };
      mockPrisma.proposal.findUnique.mockResolvedValueOnce(noFiles);
      mockPrisma.mahasiswa.findUnique.mockResolvedValueOnce({ id: 1n });
      await expect(service.submitProposal(1n, 'u1')).rejects.toThrow(BadRequestException);
    });

    it('should throw if status is not draft', async () => {
      const submitted = { ...mockProposal, status: 'submitted' };
      mockPrisma.proposal.findUnique.mockResolvedValueOnce(submitted);
      mockPrisma.mahasiswa.findUnique.mockResolvedValueOnce({ id: 1n });
      await expect(service.submitProposal(1n, 'u1')).rejects.toThrow(BadRequestException);
    });

    it('should submit proposal successfully', async () => {
      mockPrisma.proposal.findUnique.mockResolvedValueOnce(mockProposal);
      mockPrisma.mahasiswa.findUnique.mockResolvedValueOnce({ id: 1n });
      mockPrisma.systemConfig.findUnique.mockResolvedValueOnce(null);
      mockPrisma.proposal.update.mockResolvedValueOnce({ id: 1n, status: 'submitted' });

      const result = await service.submitProposal(1n, 'u1');
      expect(result.status).toBe('submitted');
    });
  });

  describe('uploadFile', () => {
    it('should throw if not PDF', async () => {
      mockPrisma.proposal.findUnique.mockResolvedValueOnce({
        id: 1n,
        status: 'draft',
        team: { teamMembers: [], _count: { teamMembers: 0 } },
        proposalFiles: [],
      });
      await expect(
        service.uploadFile(1n, { path: '/f', filename: 'f.doc', size: 100, mimetype: 'application/msword' }, 'u1'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw if file > 10MB', async () => {
      mockPrisma.proposal.findUnique.mockResolvedValueOnce({
        id: 1n,
        status: 'draft',
        team: { teamMembers: [], _count: { teamMembers: 0 } },
        proposalFiles: [],
      });
      await expect(
        service.uploadFile(1n, { path: '/f', filename: 'f.pdf', size: 11 * 1024 * 1024, mimetype: 'application/pdf' }, 'u1'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw if status does not allow upload', async () => {
      mockPrisma.proposal.findUnique.mockResolvedValueOnce({
        id: 1n,
        status: 'submitted',
        team: { teamMembers: [], _count: { teamMembers: 0 } },
        proposalFiles: [],
      });
      await expect(
        service.uploadFile(1n, { path: '/f', filename: 'f.pdf', size: 100, mimetype: 'application/pdf' }, 'u1'),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('getFile', () => {
    it('should return latest file', async () => {
      mockPrisma.proposalFile.findMany.mockResolvedValueOnce([{ id: 1n, fileName: 'test.pdf' }]);
      const result = await service.getFile(1n);
      expect(result.fileName).toBe('test.pdf');
    });

    it('should throw if no files', async () => {
      mockPrisma.proposalFile.findMany.mockResolvedValueOnce([]);
      await expect(service.getFile(1n)).rejects.toThrow(NotFoundException);
    });
  });
});
