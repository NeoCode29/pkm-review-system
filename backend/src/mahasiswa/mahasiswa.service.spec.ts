import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { MahasiswaService } from './mahasiswa.service';
import { PrismaService } from '../prisma/prisma.service';

const mockPrisma = {
  mahasiswa: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
  },
};

describe('MahasiswaService', () => {
  let service: MahasiswaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MahasiswaService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<MahasiswaService>(MahasiswaService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should return all mahasiswa', async () => {
      mockPrisma.mahasiswa.findMany.mockResolvedValueOnce([{ id: 1n, nama: 'Test' }]);
      const result = await service.findAll();
      expect(result).toHaveLength(1);
    });

    it('should filter by search', async () => {
      mockPrisma.mahasiswa.findMany.mockResolvedValueOnce([]);
      await service.findAll('test');
      expect(mockPrisma.mahasiswa.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ OR: expect.any(Array) }),
        }),
      );
    });
  });

  describe('findOne', () => {
    it('should return mahasiswa by id', async () => {
      mockPrisma.mahasiswa.findUnique.mockResolvedValueOnce({ id: 1n, nama: 'Test' });
      const result = await service.findOne(1n);
      expect(result.nama).toBe('Test');
    });

    it('should throw NotFoundException', async () => {
      mockPrisma.mahasiswa.findUnique.mockResolvedValueOnce(null);
      await expect(service.findOne(99n)).rejects.toThrow(NotFoundException);
    });
  });

  describe('findByUserId', () => {
    it('should return mahasiswa by userId', async () => {
      mockPrisma.mahasiswa.findUnique.mockResolvedValueOnce({ id: 1n, userId: 'u1' });
      const result = await service.findByUserId('u1');
      expect(result).toBeDefined();
    });

    it('should throw NotFoundException if not found', async () => {
      mockPrisma.mahasiswa.findUnique.mockResolvedValueOnce(null);
      await expect(service.findByUserId('missing')).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should update mahasiswa', async () => {
      mockPrisma.mahasiswa.findUnique.mockResolvedValueOnce({ id: 1n });
      mockPrisma.mahasiswa.update.mockResolvedValueOnce({ id: 1n, nama: 'Updated' });
      const result = await service.update(1n, { nama: 'Updated' }, 'u1');
      expect(result.nama).toBe('Updated');
    });
  });

  describe('getDashboard', () => {
    it('should return dashboard with team', async () => {
      mockPrisma.mahasiswa.findUnique.mockResolvedValueOnce({
        id: 1n,
        teamMembers: [{ team: { id: 1n, proposals: [] } }],
      });
      const result = await service.getDashboard('u1');
      expect(result.hasTeam).toBe(true);
    });

    it('should return dashboard without team', async () => {
      mockPrisma.mahasiswa.findUnique.mockResolvedValueOnce({
        id: 1n,
        teamMembers: [],
      });
      const result = await service.getDashboard('u1');
      expect(result.hasTeam).toBe(false);
      expect(result.team).toBeNull();
    });

    it('should throw NotFoundException if mahasiswa not found', async () => {
      mockPrisma.mahasiswa.findUnique.mockResolvedValueOnce(null);
      await expect(service.getDashboard('missing')).rejects.toThrow(NotFoundException);
    });
  });
});
