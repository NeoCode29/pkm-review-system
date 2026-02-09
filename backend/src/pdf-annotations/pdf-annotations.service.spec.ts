import { Test, TestingModule } from '@nestjs/testing';
import {
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PdfAnnotationsService } from './pdf-annotations.service';
import { PrismaService } from '../prisma/prisma.service';

const mockPrisma = {
  reviewerAssignment: { findUnique: jest.fn() },
  proposalFile: { findUnique: jest.fn() },
  pdfAnnotation: {
    create: jest.fn(),
    findMany: jest.fn(),
    findUnique: jest.fn(),
    delete: jest.fn(),
  },
  reviewerUser: { findUnique: jest.fn() },
  systemConfig: { findUnique: jest.fn() },
};

describe('PdfAnnotationsService', () => {
  let service: PdfAnnotationsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PdfAnnotationsService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<PdfAnnotationsService>(PdfAnnotationsService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should throw if assignment not found', async () => {
      mockPrisma.reviewerAssignment.findUnique.mockResolvedValueOnce(null);
      await expect(
        service.create({
          proposalFileId: '1',
          reviewerAssignmentId: '99',
          type: 'highlight',
          pageNumber: 1,
          annotationData: {},
        }, 'u1'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw if user not assigned reviewer', async () => {
      mockPrisma.reviewerAssignment.findUnique.mockResolvedValueOnce({
        id: 1n,
        reviewerUser: { userId: 'other' },
      });
      await expect(
        service.create({
          proposalFileId: '1',
          reviewerAssignmentId: '1',
          type: 'highlight',
          pageNumber: 1,
          annotationData: {},
        }, 'u1'),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw if file not found', async () => {
      mockPrisma.reviewerAssignment.findUnique.mockResolvedValueOnce({
        id: 1n,
        reviewerUser: { userId: 'u1' },
      });
      mockPrisma.proposalFile.findUnique.mockResolvedValueOnce(null);
      await expect(
        service.create({
          proposalFileId: '99',
          reviewerAssignmentId: '1',
          type: 'highlight',
          pageNumber: 1,
          annotationData: {},
        }, 'u1'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should create annotation', async () => {
      mockPrisma.reviewerAssignment.findUnique.mockResolvedValueOnce({
        id: 1n,
        reviewerUser: { userId: 'u1' },
      });
      mockPrisma.proposalFile.findUnique.mockResolvedValueOnce({ id: 1n });
      mockPrisma.pdfAnnotation.create.mockResolvedValueOnce({
        id: 1n,
        type: 'highlight',
        pageNumber: 1,
      });

      const result = await service.create({
        proposalFileId: '1',
        reviewerAssignmentId: '1',
        type: 'highlight',
        pageNumber: 1,
        annotationData: { text: 'test' },
      }, 'u1');
      expect(result.type).toBe('highlight');
    });
  });

  describe('findByFile', () => {
    it('should return all annotations for admin', async () => {
      mockPrisma.pdfAnnotation.findMany.mockResolvedValueOnce([{ id: 1n }]);
      const result = await service.findByFile(1n, 'admin', true);
      expect(result).toHaveLength(1);
    });

    it('should throw if reviewer not found (non-admin)', async () => {
      mockPrisma.reviewerUser.findUnique.mockResolvedValueOnce(null);
      await expect(service.findByFile(1n, 'u1', false)).rejects.toThrow(ForbiddenException);
    });

    it('should return only own annotations for reviewer (blind review)', async () => {
      mockPrisma.reviewerUser.findUnique.mockResolvedValueOnce({ id: 1n });
      mockPrisma.pdfAnnotation.findMany.mockResolvedValueOnce([{ id: 1n }]);
      const result = await service.findByFile(1n, 'u1', false);
      expect(result).toHaveLength(1);
    });
  });

  describe('remove', () => {
    it('should throw if annotation not found', async () => {
      mockPrisma.pdfAnnotation.findUnique.mockResolvedValueOnce(null);
      await expect(service.remove(99n, 'u1')).rejects.toThrow(NotFoundException);
    });

    it('should throw if not owner', async () => {
      mockPrisma.pdfAnnotation.findUnique.mockResolvedValueOnce({
        id: 1n,
        reviewerAssignment: { reviewerUser: { userId: 'other' } },
      });
      await expect(service.remove(1n, 'u1')).rejects.toThrow(ForbiddenException);
    });

    it('should delete annotation', async () => {
      mockPrisma.pdfAnnotation.findUnique.mockResolvedValueOnce({
        id: 1n,
        reviewerAssignment: { reviewerUser: { userId: 'u1' } },
      });
      mockPrisma.systemConfig.findUnique.mockResolvedValueOnce(null);
      mockPrisma.pdfAnnotation.delete.mockResolvedValueOnce({ id: 1n });

      await service.remove(1n, 'u1');
      expect(mockPrisma.pdfAnnotation.delete).toHaveBeenCalledWith({ where: { id: 1n } });
    });
  });
});
