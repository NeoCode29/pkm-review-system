import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { JurusanService } from './jurusan.service';
import { PrismaService } from '../prisma/prisma.service';

const mockPrisma = {
  jurusan: {
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
};

describe('JurusanService', () => {
  let service: JurusanService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JurusanService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<JurusanService>(JurusanService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create jurusan', async () => {
      mockPrisma.jurusan.findUnique.mockResolvedValueOnce(null);
      mockPrisma.jurusan.create.mockResolvedValueOnce({ id: 1n, nama: 'TI' });

      const result = await service.create({ nama: 'TI' }, 'user-1');
      expect(result.nama).toBe('TI');
      expect(mockPrisma.jurusan.create).toHaveBeenCalledWith({
        data: { nama: 'TI', createdBy: 'user-1' },
      });
    });

    it('should throw ConflictException if nama exists', async () => {
      mockPrisma.jurusan.findUnique.mockResolvedValueOnce({ id: 1n });

      await expect(service.create({ nama: 'TI' })).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('findAll', () => {
    it('should return all jurusan', async () => {
      mockPrisma.jurusan.findMany.mockResolvedValueOnce([{ id: 1n, nama: 'TI' }]);
      const result = await service.findAll();
      expect(result).toHaveLength(1);
    });
  });

  describe('findOne', () => {
    it('should return jurusan by id', async () => {
      mockPrisma.jurusan.findUnique.mockResolvedValueOnce({ id: 1n, nama: 'TI' });
      const result = await service.findOne(1n);
      expect(result.nama).toBe('TI');
    });

    it('should throw NotFoundException if not found', async () => {
      mockPrisma.jurusan.findUnique.mockResolvedValueOnce(null);
      await expect(service.findOne(99n)).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should update jurusan', async () => {
      mockPrisma.jurusan.findUnique.mockResolvedValueOnce({ id: 1n, nama: 'TI' });
      mockPrisma.jurusan.findFirst.mockResolvedValueOnce(null);
      mockPrisma.jurusan.update.mockResolvedValueOnce({ id: 1n, nama: 'Teknik Informatika' });

      const result = await service.update(1n, { nama: 'Teknik Informatika' }, 'user-1');
      expect(result.nama).toBe('Teknik Informatika');
    });

    it('should throw ConflictException if new nama already exists', async () => {
      mockPrisma.jurusan.findUnique.mockResolvedValueOnce({ id: 1n, nama: 'TI' });
      mockPrisma.jurusan.findFirst.mockResolvedValueOnce({ id: 2n, nama: 'Teknik Informatika' });

      await expect(
        service.update(1n, { nama: 'Teknik Informatika' }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('remove', () => {
    it('should delete jurusan', async () => {
      mockPrisma.jurusan.findUnique.mockResolvedValueOnce({ id: 1n });
      mockPrisma.jurusan.delete.mockResolvedValueOnce({ id: 1n });

      const result = await service.remove(1n);
      expect(mockPrisma.jurusan.delete).toHaveBeenCalledWith({ where: { id: 1n } });
    });

    it('should throw NotFoundException if not found', async () => {
      mockPrisma.jurusan.findUnique.mockResolvedValueOnce(null);
      await expect(service.remove(99n)).rejects.toThrow(NotFoundException);
    });
  });
});
