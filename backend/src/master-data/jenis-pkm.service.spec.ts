import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { JenisPkmService } from './jenis-pkm.service';
import { PrismaService } from '../prisma/prisma.service';

const mockPrisma = {
  jenisPkm: {
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
};

describe('JenisPkmService', () => {
  let service: JenisPkmService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JenisPkmService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<JenisPkmService>(JenisPkmService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create jenis PKM', async () => {
      mockPrisma.jenisPkm.findUnique.mockResolvedValue(null);
      mockPrisma.jenisPkm.create.mockResolvedValueOnce({
        id: 1n,
        nama: 'PKM-RE',
        kode: 'PKM-RE',
      });

      const result = await service.create({ nama: 'PKM-RE', kode: 'PKM-RE' });
      expect(result.nama).toBe('PKM-RE');
    });

    it('should throw ConflictException if nama exists', async () => {
      mockPrisma.jenisPkm.findUnique.mockResolvedValueOnce({ id: 1n });

      await expect(
        service.create({ nama: 'PKM-RE' }),
      ).rejects.toThrow(ConflictException);
    });

    it('should throw ConflictException if kode exists', async () => {
      mockPrisma.jenisPkm.findUnique
        .mockResolvedValueOnce(null) // nama check
        .mockResolvedValueOnce({ id: 1n }); // kode check

      await expect(
        service.create({ nama: 'PKM-New', kode: 'PKM-RE' }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('findAll', () => {
    it('should return all jenis PKM', async () => {
      mockPrisma.jenisPkm.findMany.mockResolvedValueOnce([{ id: 1n }]);
      const result = await service.findAll();
      expect(result).toHaveLength(1);
    });
  });

  describe('findOne', () => {
    it('should return jenis PKM by id', async () => {
      mockPrisma.jenisPkm.findUnique.mockResolvedValueOnce({ id: 1n, nama: 'PKM-RE' });
      const result = await service.findOne(1n);
      expect(result.nama).toBe('PKM-RE');
    });

    it('should throw NotFoundException', async () => {
      mockPrisma.jenisPkm.findUnique.mockResolvedValueOnce(null);
      await expect(service.findOne(99n)).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should update jenis PKM', async () => {
      mockPrisma.jenisPkm.findUnique.mockResolvedValueOnce({ id: 1n });
      mockPrisma.jenisPkm.findFirst.mockResolvedValue(null);
      mockPrisma.jenisPkm.update.mockResolvedValueOnce({ id: 1n, nama: 'PKM-RS' });

      const result = await service.update(1n, { nama: 'PKM-RS' });
      expect(result.nama).toBe('PKM-RS');
    });
  });

  describe('remove', () => {
    it('should delete jenis PKM', async () => {
      mockPrisma.jenisPkm.findUnique.mockResolvedValueOnce({ id: 1n });
      mockPrisma.jenisPkm.delete.mockResolvedValueOnce({ id: 1n });

      await service.remove(1n);
      expect(mockPrisma.jenisPkm.delete).toHaveBeenCalledWith({ where: { id: 1n } });
    });
  });
});
