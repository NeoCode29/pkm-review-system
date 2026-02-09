import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, NotFoundException, InternalServerErrorException } from '@nestjs/common';
import { ReviewersService } from './reviewers.service';
import { PrismaService } from '../prisma/prisma.service';
import { SupabaseService } from '../auth/supabase.service';

const mockPrisma = {
  reviewerUser: {
    findFirst: jest.fn(),
    findUnique: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
};

const mockAdminClient = {
  auth: {
    admin: {
      createUser: jest.fn(),
      deleteUser: jest.fn(),
    },
  },
};

const mockSupabaseService = {
  getAdminClient: jest.fn(() => mockAdminClient),
};

describe('ReviewersService', () => {
  let service: ReviewersService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReviewersService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: SupabaseService, useValue: mockSupabaseService },
      ],
    }).compile();

    service = module.get<ReviewersService>(ReviewersService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should throw ConflictException if email exists', async () => {
      mockPrisma.reviewerUser.findFirst.mockResolvedValueOnce({ id: 1n });
      await expect(
        service.create({ nama: 'R', email: 'r@test.com', password: '123456' }, 'admin1'),
      ).rejects.toThrow(ConflictException);
    });

    it('should throw if Supabase auth fails', async () => {
      mockPrisma.reviewerUser.findFirst.mockResolvedValueOnce(null);
      mockAdminClient.auth.admin.createUser.mockResolvedValueOnce({
        data: { user: null },
        error: { message: 'Auth error' },
      });
      await expect(
        service.create({ nama: 'R', email: 'r@test.com', password: '123456' }, 'admin1'),
      ).rejects.toThrow(InternalServerErrorException);
    });

    it('should create reviewer with one-step transaction', async () => {
      mockPrisma.reviewerUser.findFirst.mockResolvedValueOnce(null);
      mockAdminClient.auth.admin.createUser.mockResolvedValueOnce({
        data: { user: { id: 'uuid-1' } },
        error: null,
      });
      mockPrisma.reviewerUser.create.mockResolvedValueOnce({
        id: 1n,
        nama: 'Dr. Reviewer',
        email: 'r@test.com',
      });

      const result = await service.create(
        { nama: 'Dr. Reviewer', email: 'r@test.com', password: '123456' },
        'admin1',
      );
      expect(result.nama).toBe('Dr. Reviewer');
    });

    it('should rollback auth user if profile creation fails', async () => {
      mockPrisma.reviewerUser.findFirst.mockResolvedValueOnce(null);
      mockAdminClient.auth.admin.createUser.mockResolvedValueOnce({
        data: { user: { id: 'uuid-1' } },
        error: null,
      });
      mockPrisma.reviewerUser.create.mockRejectedValueOnce(new Error('DB error'));
      mockAdminClient.auth.admin.deleteUser.mockResolvedValueOnce({});

      await expect(
        service.create({ nama: 'R', email: 'r@test.com', password: '123456' }, 'admin1'),
      ).rejects.toThrow(InternalServerErrorException);
      expect(mockAdminClient.auth.admin.deleteUser).toHaveBeenCalledWith('uuid-1');
    });
  });

  describe('findAll', () => {
    it('should return all reviewers', async () => {
      mockPrisma.reviewerUser.findMany.mockResolvedValueOnce([{ id: 1n }]);
      const result = await service.findAll();
      expect(result).toHaveLength(1);
    });
  });

  describe('findOne', () => {
    it('should return reviewer with stats', async () => {
      mockPrisma.reviewerUser.findUnique.mockResolvedValueOnce({
        id: 1n,
        nama: 'Dr. R',
        reviewerAssignments: [
          { penilaianAdministrasi: { isComplete: true }, penilaianSubstansi: { isComplete: true } },
          { penilaianAdministrasi: { isComplete: false }, penilaianSubstansi: null },
        ],
      });
      const result = await service.findOne(1n);
      expect(result.stats.totalAssigned).toBe(2);
      expect(result.stats.completed).toBe(1);
      expect(result.stats.pending).toBe(1);
    });

    it('should throw NotFoundException', async () => {
      mockPrisma.reviewerUser.findUnique.mockResolvedValueOnce(null);
      await expect(service.findOne(99n)).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should update reviewer', async () => {
      mockPrisma.reviewerUser.findUnique.mockResolvedValueOnce({
        id: 1n,
        reviewerAssignments: [],
      });
      mockPrisma.reviewerUser.update.mockResolvedValueOnce({ id: 1n, nama: 'Updated' });
      const result = await service.update(1n, { nama: 'Updated' }, 'admin1');
      expect(result.nama).toBe('Updated');
    });
  });

  describe('remove', () => {
    it('should delete reviewer and auth user', async () => {
      mockPrisma.reviewerUser.findUnique.mockResolvedValueOnce({
        id: 1n,
        userId: 'uuid-1',
        reviewerAssignments: [],
      });
      mockAdminClient.auth.admin.deleteUser.mockResolvedValueOnce({});
      mockPrisma.reviewerUser.delete.mockResolvedValueOnce({ id: 1n });

      await service.remove(1n);
      expect(mockAdminClient.auth.admin.deleteUser).toHaveBeenCalledWith('uuid-1');
      expect(mockPrisma.reviewerUser.delete).toHaveBeenCalledWith({ where: { id: 1n } });
    });
  });
});
