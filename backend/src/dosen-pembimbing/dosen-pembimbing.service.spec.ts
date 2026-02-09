import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { DosenPembimbingService } from './dosen-pembimbing.service';
import { PrismaService } from '../prisma/prisma.service';

const mockPrisma = {
  dosenPembimbing: {
    findFirst: jest.fn(),
    findUnique: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
};

describe('DosenPembimbingService', () => {
  let service: DosenPembimbingService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DosenPembimbingService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<DosenPembimbingService>(DosenPembimbingService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findOrCreate', () => {
    it('should return existing dosen if name matches', async () => {
      mockPrisma.dosenPembimbing.findFirst.mockResolvedValueOnce({ id: 1n, nama: 'Dr. Budi' });
      const result = await service.findOrCreate({ nama: 'Dr. Budi' });
      expect(result.id).toBe(1n);
      expect(mockPrisma.dosenPembimbing.create).not.toHaveBeenCalled();
    });

    it('should create new dosen if name not found', async () => {
      mockPrisma.dosenPembimbing.findFirst.mockResolvedValueOnce(null);
      mockPrisma.dosenPembimbing.create.mockResolvedValueOnce({ id: 2n, nama: 'Dr. New' });
      const result = await service.findOrCreate({ nama: 'Dr. New' });
      expect(result.nama).toBe('Dr. New');
      expect(mockPrisma.dosenPembimbing.create).toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    it('should return all dosen', async () => {
      mockPrisma.dosenPembimbing.findMany.mockResolvedValueOnce([{ id: 1n }]);
      const result = await service.findAll();
      expect(result).toHaveLength(1);
    });

    it('should filter by search', async () => {
      mockPrisma.dosenPembimbing.findMany.mockResolvedValueOnce([]);
      await service.findAll('budi');
      expect(mockPrisma.dosenPembimbing.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { nama: { contains: 'budi', mode: 'insensitive' } },
        }),
      );
    });
  });

  describe('findOne', () => {
    it('should return dosen by id', async () => {
      mockPrisma.dosenPembimbing.findUnique.mockResolvedValueOnce({ id: 1n, nama: 'Dr. Budi' });
      const result = await service.findOne(1n);
      expect(result.nama).toBe('Dr. Budi');
    });

    it('should throw NotFoundException', async () => {
      mockPrisma.dosenPembimbing.findUnique.mockResolvedValueOnce(null);
      await expect(service.findOne(99n)).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should update dosen', async () => {
      mockPrisma.dosenPembimbing.findUnique.mockResolvedValueOnce({ id: 1n });
      mockPrisma.dosenPembimbing.update.mockResolvedValueOnce({ id: 1n, nama: 'Updated' });
      const result = await service.update(1n, { nama: 'Updated' });
      expect(result.nama).toBe('Updated');
    });
  });

  describe('remove', () => {
    it('should delete dosen', async () => {
      mockPrisma.dosenPembimbing.findUnique.mockResolvedValueOnce({ id: 1n });
      mockPrisma.dosenPembimbing.delete.mockResolvedValueOnce({ id: 1n });
      await service.remove(1n);
      expect(mockPrisma.dosenPembimbing.delete).toHaveBeenCalledWith({ where: { id: 1n } });
    });
  });
});
