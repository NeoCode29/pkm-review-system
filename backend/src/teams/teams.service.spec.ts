import { Test, TestingModule } from '@nestjs/testing';
import {
  BadRequestException,
  ConflictException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { TeamsService } from './teams.service';
import { PrismaService } from '../prisma/prisma.service';

const mockTx = {
  team: { create: jest.fn(), findUnique: jest.fn() },
  teamMember: { create: jest.fn() },
  proposal: { createMany: jest.fn() },
  joinRequest: { update: jest.fn() },
};

const mockPrisma = {
  mahasiswa: { findUnique: jest.fn() },
  teamMember: {
    findFirst: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
    update: jest.fn(),
  },
  jenisPkm: { findUnique: jest.fn() },
  dosenPembimbing: { findUnique: jest.fn() },
  team: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
  },
  joinRequest: {
    findFirst: jest.fn(),
    findUnique: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
  reviewerAssignment: { count: jest.fn() },
  $transaction: jest.fn((cb) => cb(mockTx)),
};

describe('TeamsService', () => {
  let service: TeamsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TeamsService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<TeamsService>(TeamsService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should throw if mahasiswa not found', async () => {
      mockPrisma.mahasiswa.findUnique.mockResolvedValueOnce(null);
      await expect(
        service.create({ namaTeam: 'T', judulProposal: 'J', jenisPkmId: '1' }, 'u1'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw if mahasiswa already in a team', async () => {
      mockPrisma.mahasiswa.findUnique.mockResolvedValueOnce({ id: 1n });
      mockPrisma.teamMember.findFirst.mockResolvedValueOnce({ id: 1n });
      await expect(
        service.create({ namaTeam: 'T', judulProposal: 'J', jenisPkmId: '1' }, 'u1'),
      ).rejects.toThrow(ConflictException);
    });

    it('should throw if jenis PKM not found', async () => {
      mockPrisma.mahasiswa.findUnique.mockResolvedValueOnce({ id: 1n });
      mockPrisma.teamMember.findFirst.mockResolvedValueOnce(null);
      mockPrisma.jenisPkm.findUnique.mockResolvedValueOnce(null);
      await expect(
        service.create({ namaTeam: 'T', judulProposal: 'J', jenisPkmId: '99' }, 'u1'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should create team with transaction', async () => {
      mockPrisma.mahasiswa.findUnique.mockResolvedValueOnce({ id: 1n });
      mockPrisma.teamMember.findFirst.mockResolvedValueOnce(null);
      mockPrisma.jenisPkm.findUnique.mockResolvedValueOnce({ id: 1n });
      mockTx.team.create.mockResolvedValueOnce({ id: 1n });
      mockTx.teamMember.create.mockResolvedValueOnce({});
      mockTx.proposal.createMany.mockResolvedValueOnce({});
      mockTx.team.findUnique.mockResolvedValueOnce({
        id: 1n,
        namaTeam: 'T',
        teamMembers: [],
        proposals: [],
      });

      const result = await service.create(
        { namaTeam: 'T', judulProposal: 'J', jenisPkmId: '1' },
        'u1',
      );
      expect(result!.namaTeam).toBe('T');
      expect(mockPrisma.$transaction).toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    it('should return paginated active teams', async () => {
      mockPrisma.team.findMany.mockResolvedValueOnce([{ id: 1n }]);
      mockPrisma.team.count.mockResolvedValueOnce(1);
      const result = await service.findAll();
      expect(result.data).toHaveLength(1);
      expect(result.meta.total).toBe(1);
    });
  });

  describe('findOne', () => {
    it('should return team by id', async () => {
      mockPrisma.team.findUnique.mockResolvedValueOnce({
        id: 1n,
        teamMembers: [],
        proposals: [],
      });
      const result = await service.findOne(1n);
      expect(result).toBeDefined();
    });

    it('should throw NotFoundException', async () => {
      mockPrisma.team.findUnique.mockResolvedValueOnce(null);
      await expect(service.findOne(99n)).rejects.toThrow(NotFoundException);
    });
  });

  describe('browse', () => {
    it('should return paginated open teams', async () => {
      mockPrisma.team.findMany.mockResolvedValueOnce([{ id: 1n, openToJoin: true }]);
      mockPrisma.team.count.mockResolvedValueOnce(1);
      const result = await service.browse();
      expect(result.data).toHaveLength(1);
      expect(result.meta.total).toBe(1);
    });
  });

  describe('getCascadeImpact', () => {
    it('should return impact counts without deleting', async () => {
      mockPrisma.team.findUnique.mockResolvedValueOnce({
        id: 1n,
        namaTeam: 'Team A',
        teamMembers: [{ id: 1n }, { id: 2n }],
        proposals: [{ id: 1n }, { id: 2n }],
      });
      mockPrisma.reviewerAssignment.count.mockResolvedValueOnce(3);

      const result = await service.getCascadeImpact(1n);
      expect(result.impact.members).toBe(2);
      expect(result.impact.proposals).toBe(2);
      expect(result.impact.reviews).toBe(3);
      expect(mockPrisma.team.delete).not.toHaveBeenCalled();
    });
  });

  describe('addMember', () => {
    it('should throw if team is full', async () => {
      mockPrisma.team.findUnique.mockResolvedValueOnce({
        id: 1n,
        teamMembers: [{}, {}, {}, {}, {}],
        proposals: [],
      });
      await expect(
        service.addMember(1n, { mahasiswaId: '2' }, 'u1'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw if mahasiswa already in a team', async () => {
      mockPrisma.team.findUnique.mockResolvedValueOnce({
        id: 1n,
        teamMembers: [{}],
        proposals: [],
      });
      mockPrisma.teamMember.findFirst.mockResolvedValueOnce({ id: 1n });
      await expect(
        service.addMember(1n, { mahasiswaId: '2' }, 'u1'),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('removeMember', () => {
    it('should throw if member not found', async () => {
      mockPrisma.teamMember.findUnique.mockResolvedValueOnce(null);
      await expect(service.removeMember(1n, 99n, 'u1')).rejects.toThrow(NotFoundException);
    });

    it('should auto-delete team if 0 members remain', async () => {
      mockPrisma.teamMember.findUnique.mockResolvedValueOnce({ id: 1n, teamId: 1n });
      mockPrisma.teamMember.delete.mockResolvedValueOnce({});
      mockPrisma.teamMember.count.mockResolvedValueOnce(0);
      mockPrisma.team.delete.mockResolvedValueOnce({});

      const result = await service.removeMember(1n, 1n, 'u1');
      expect(result.message).toContain('otomatis dihapus');
    });
  });

  describe('createJoinRequest', () => {
    it('should throw if mahasiswa not found', async () => {
      mockPrisma.mahasiswa.findUnique.mockResolvedValueOnce(null);
      await expect(service.createJoinRequest(1n, 'u1')).rejects.toThrow(BadRequestException);
    });

    it('should throw if already in a team', async () => {
      mockPrisma.mahasiswa.findUnique.mockResolvedValueOnce({ id: 1n });
      mockPrisma.teamMember.findFirst.mockResolvedValueOnce({ id: 1n });
      await expect(service.createJoinRequest(1n, 'u1')).rejects.toThrow(ConflictException);
    });
  });

  describe('approveJoinRequest', () => {
    it('should throw if request not found', async () => {
      mockPrisma.joinRequest.findUnique.mockResolvedValueOnce(null);
      await expect(service.approveJoinRequest(99n, 'u1')).rejects.toThrow(NotFoundException);
    });

    it('should throw if request already processed', async () => {
      mockPrisma.joinRequest.findUnique.mockResolvedValueOnce({
        id: 1n,
        status: 'approved',
        team: { _count: { teamMembers: 3 } },
      });
      await expect(service.approveJoinRequest(1n, 'u1')).rejects.toThrow(BadRequestException);
    });
  });

  describe('rejectJoinRequest', () => {
    it('should throw if request not found', async () => {
      mockPrisma.joinRequest.findUnique.mockResolvedValueOnce(null);
      await expect(service.rejectJoinRequest(99n, 'u1')).rejects.toThrow(NotFoundException);
    });

    it('should reject pending request', async () => {
      mockPrisma.joinRequest.findUnique.mockResolvedValueOnce({ id: 1n, status: 'pending' });
      mockPrisma.joinRequest.update.mockResolvedValueOnce({ id: 1n, status: 'rejected' });
      const result = await service.rejectJoinRequest(1n, 'u1');
      expect(result.status).toBe('rejected');
    });
  });
});
