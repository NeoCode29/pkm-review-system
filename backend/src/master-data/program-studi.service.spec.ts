import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, NotFoundException, BadRequestException } from '@nestjs/common';
import { ProgramStudiService } from './program-studi.service';
import { PrismaService } from '../prisma/prisma.service';

const mockPrisma = {
  programStudi: {
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  jurusan: {
    findUnique: jest.fn(),
  },
};

describe('ProgramStudiService', () => {
  let service: ProgramStudiService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProgramStudiService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<ProgramStudiService>(ProgramStudiService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create program studi', async () => {
      mockPrisma.jurusan.findUnique.mockResolvedValueOnce({ id: 1n });
      mockPrisma.programStudi.findFirst.mockResolvedValueOnce(null);
      mockPrisma.programStudi.create.mockResolvedValueOnce({
        id: 1n,
        nama: 'Informatika',
        jurusanId: 1n,
      });

      const result = await service.create({ nama: 'Informatika', jurusanId: '1' });
      expect(result.nama).toBe('Informatika');
    });

    it('should throw BadRequestException if jurusan not found', async () => {
      mockPrisma.jurusan.findUnique.mockResolvedValueOnce(null);

      await expect(
        service.create({ nama: 'Informatika', jurusanId: '99' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw ConflictException if nama exists in same jurusan', async () => {
      mockPrisma.jurusan.findUnique.mockResolvedValueOnce({ id: 1n });
      mockPrisma.programStudi.findFirst.mockResolvedValueOnce({ id: 1n });

      await expect(
        service.create({ nama: 'Informatika', jurusanId: '1' }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('findAll', () => {
    it('should return all program studi', async () => {
      mockPrisma.programStudi.findMany.mockResolvedValueOnce([{ id: 1n }]);
      const result = await service.findAll();
      expect(result).toHaveLength(1);
    });

    it('should filter by jurusanId', async () => {
      mockPrisma.programStudi.findMany.mockResolvedValueOnce([{ id: 1n }]);
      await service.findAll('1');
      expect(mockPrisma.programStudi.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { jurusanId: 1n },
        }),
      );
    });
  });

  describe('findOne', () => {
    it('should return program studi by id', async () => {
      mockPrisma.programStudi.findUnique.mockResolvedValueOnce({ id: 1n, nama: 'Informatika' });
      const result = await service.findOne(1n);
      expect(result.nama).toBe('Informatika');
    });

    it('should throw NotFoundException', async () => {
      mockPrisma.programStudi.findUnique.mockResolvedValueOnce(null);
      await expect(service.findOne(99n)).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should delete program studi', async () => {
      mockPrisma.programStudi.findUnique.mockResolvedValueOnce({ id: 1n });
      mockPrisma.programStudi.delete.mockResolvedValueOnce({ id: 1n });

      await service.remove(1n);
      expect(mockPrisma.programStudi.delete).toHaveBeenCalledWith({ where: { id: 1n } });
    });
  });
});
