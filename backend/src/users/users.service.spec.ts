import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { UsersService } from './users.service';
import { PrismaService } from '../prisma/prisma.service';
import { SupabaseService } from '../auth/supabase.service';

const mockPrisma = {
  mahasiswa: { findMany: jest.fn(), findUnique: jest.fn(), delete: jest.fn() },
  reviewerUser: { findMany: jest.fn(), findUnique: jest.fn(), delete: jest.fn() },
};

const mockAdminClient = {
  auth: {
    admin: {
      updateUserById: jest.fn(),
      deleteUser: jest.fn(),
    },
  },
};

const mockSupabaseService = {
  getAdminClient: jest.fn(() => mockAdminClient),
};

describe('UsersService', () => {
  let service: UsersService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: SupabaseService, useValue: mockSupabaseService },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should return all users grouped by role', async () => {
      mockPrisma.mahasiswa.findMany.mockResolvedValueOnce([{ id: 1n, nama: 'M1' }]);
      mockPrisma.reviewerUser.findMany.mockResolvedValueOnce([{ id: 1n, nama: 'R1' }]);

      const result = await service.findAll();
      expect(result.mahasiswa).toHaveLength(1);
      expect(result.reviewers).toHaveLength(1);
      expect(result.mahasiswa[0].role).toBe('mahasiswa');
      expect(result.reviewers[0].role).toBe('reviewer');
    });
  });

  describe('deactivate', () => {
    it('should deactivate user', async () => {
      mockAdminClient.auth.admin.updateUserById.mockResolvedValueOnce({ error: null });
      const result = await service.deactivate('uuid-1');
      expect(result.message).toContain('dinonaktifkan');
    });

    it('should throw if user not found in auth', async () => {
      mockAdminClient.auth.admin.updateUserById.mockResolvedValueOnce({ error: { message: 'not found' } });
      await expect(service.deactivate('bad')).rejects.toThrow(NotFoundException);
    });
  });

  describe('activate', () => {
    it('should activate user', async () => {
      mockAdminClient.auth.admin.updateUserById.mockResolvedValueOnce({ error: null });
      const result = await service.activate('uuid-1');
      expect(result.message).toContain('diaktifkan');
    });
  });

  describe('remove', () => {
    it('should delete mahasiswa user', async () => {
      mockPrisma.mahasiswa.findUnique.mockResolvedValueOnce({ id: 1n, userId: 'uuid-1' });
      mockPrisma.reviewerUser.findUnique.mockResolvedValueOnce(null);
      mockPrisma.mahasiswa.delete.mockResolvedValueOnce({});
      mockAdminClient.auth.admin.deleteUser.mockResolvedValueOnce({});

      const result = await service.remove('uuid-1');
      expect(result.message).toContain('dihapus');
      expect(mockPrisma.mahasiswa.delete).toHaveBeenCalled();
    });

    it('should delete reviewer user', async () => {
      mockPrisma.mahasiswa.findUnique.mockResolvedValueOnce(null);
      mockPrisma.reviewerUser.findUnique.mockResolvedValueOnce({ id: 1n, userId: 'uuid-1' });
      mockPrisma.reviewerUser.delete.mockResolvedValueOnce({});
      mockAdminClient.auth.admin.deleteUser.mockResolvedValueOnce({});

      const result = await service.remove('uuid-1');
      expect(result.message).toContain('dihapus');
      expect(mockPrisma.reviewerUser.delete).toHaveBeenCalled();
    });

    it('should throw if user not found', async () => {
      mockPrisma.mahasiswa.findUnique.mockResolvedValueOnce(null);
      mockPrisma.reviewerUser.findUnique.mockResolvedValueOnce(null);
      await expect(service.remove('bad')).rejects.toThrow(NotFoundException);
    });
  });
});
