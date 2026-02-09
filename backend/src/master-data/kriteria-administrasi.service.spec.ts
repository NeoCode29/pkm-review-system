import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { KriteriaAdministrasiService } from './kriteria-administrasi.service';
import { PrismaService } from '../prisma/prisma.service';

const mockPrisma = {
  kriteriaAdministrasi: {
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

describe('KriteriaAdministrasiService', () => {
  let service: KriteriaAdministrasiService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        KriteriaAdministrasiService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<KriteriaAdministrasiService>(KriteriaAdministrasiService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create kriteria', async () => {
      mockPrisma.jenisPkm.findUnique.mockResolvedValueOnce({ id: 1n });
      mockPrisma.kriteriaAdministrasi.create.mockResolvedValueOnce({
        id: 1n,
        deskripsi: 'Test',
      });

      const result = await service.create({
        jenisPkmId: '1',
        deskripsi: 'Test',
      });
      expect(result.deskripsi).toBe('Test');
    });

    it('should throw BadRequestException if jenis PKM not found', async () => {
      mockPrisma.jenisPkm.findUnique.mockResolvedValueOnce(null);

      await expect(
        service.create({ jenisPkmId: '99', deskripsi: 'Test' }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('findByJenisPkm', () => {
    it('should return kriteria by jenis PKM', async () => {
      mockPrisma.kriteriaAdministrasi.findMany.mockResolvedValueOnce([{ id: 1n }]);
      const result = await service.findByJenisPkm(1n);
      expect(result).toHaveLength(1);
    });
  });

  describe('findOne', () => {
    it('should return kriteria by id', async () => {
      mockPrisma.kriteriaAdministrasi.findUnique.mockResolvedValueOnce({ id: 1n });
      const result = await service.findOne(1n);
      expect(result).toBeDefined();
    });

    it('should throw NotFoundException', async () => {
      mockPrisma.kriteriaAdministrasi.findUnique.mockResolvedValueOnce(null);
      await expect(service.findOne(99n)).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should delete kriteria', async () => {
      mockPrisma.kriteriaAdministrasi.findUnique.mockResolvedValueOnce({ id: 1n });
      mockPrisma.kriteriaAdministrasi.delete.mockResolvedValueOnce({ id: 1n });

      await service.remove(1n);
      expect(mockPrisma.kriteriaAdministrasi.delete).toHaveBeenCalledWith({
        where: { id: 1n },
      });
    });
  });
});
