import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { KriteriaSubstansiService } from './kriteria-substansi.service';
import { PrismaService } from '../prisma/prisma.service';

const mockPrisma = {
  kriteriaSubstansi: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  jenisPkm: {
    findUnique: jest.fn(),
  },
};

describe('KriteriaSubstansiService', () => {
  let service: KriteriaSubstansiService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        KriteriaSubstansiService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<KriteriaSubstansiService>(KriteriaSubstansiService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create kriteria substansi', async () => {
      mockPrisma.jenisPkm.findUnique.mockResolvedValueOnce({ id: 1n });
      mockPrisma.kriteriaSubstansi.create.mockResolvedValueOnce({
        id: 1n,
        nama: 'Kualitas Penulisan',
        bobot: 20,
      });

      const result = await service.create({
        jenisPkmId: '1',
        nama: 'Kualitas Penulisan',
        skorMax: 7,
        bobot: 20,
      });
      expect(result.nama).toBe('Kualitas Penulisan');
      expect(result.bobot).toBe(20);
    });

    it('should throw BadRequestException if jenis PKM not found', async () => {
      mockPrisma.jenisPkm.findUnique.mockResolvedValueOnce(null);

      await expect(
        service.create({
          jenisPkmId: '99',
          nama: 'Test',
          skorMax: 7,
          bobot: 20,
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('findByJenisPkm', () => {
    it('should return kriteria by jenis PKM', async () => {
      mockPrisma.kriteriaSubstansi.findMany.mockResolvedValueOnce([{ id: 1n }]);
      const result = await service.findByJenisPkm(1n);
      expect(result).toHaveLength(1);
    });
  });

  describe('findOne', () => {
    it('should return kriteria by id', async () => {
      mockPrisma.kriteriaSubstansi.findUnique.mockResolvedValueOnce({
        id: 1n,
        nama: 'Test',
      });
      const result = await service.findOne(1n);
      expect(result).toBeDefined();
    });

    it('should throw NotFoundException', async () => {
      mockPrisma.kriteriaSubstansi.findUnique.mockResolvedValueOnce(null);
      await expect(service.findOne(99n)).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should delete kriteria', async () => {
      mockPrisma.kriteriaSubstansi.findUnique.mockResolvedValueOnce({ id: 1n });
      mockPrisma.kriteriaSubstansi.delete.mockResolvedValueOnce({ id: 1n });

      await service.remove(1n);
      expect(mockPrisma.kriteriaSubstansi.delete).toHaveBeenCalledWith({
        where: { id: 1n },
      });
    });
  });
});
