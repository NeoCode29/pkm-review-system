import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SupabaseStrategy } from './supabase.strategy';
import { PrismaService } from '../../prisma/prisma.service';

const mockPrismaService = {
  mahasiswa: { findUnique: jest.fn() },
  reviewerUser: { findUnique: jest.fn() },
};

const mockConfigService = {
  get: jest.fn((key: string) => {
    if (key === 'JWT_SECRET') return 'super-secret-jwt-token-with-at-least-32-characters-long';
    return null;
  }),
};

describe('SupabaseStrategy', () => {
  let strategy: SupabaseStrategy;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SupabaseStrategy,
        { provide: ConfigService, useValue: mockConfigService },
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    strategy = module.get<SupabaseStrategy>(SupabaseStrategy);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(strategy).toBeDefined();
  });

  describe('validate', () => {
    it('should throw UnauthorizedException if no userId in payload', async () => {
      await expect(
        strategy.validate({ sub: '', email: 'test@example.com' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should return mahasiswa user when mahasiswa profile found', async () => {
      mockPrismaService.mahasiswa.findUnique.mockResolvedValueOnce({
        id: 1n,
        email: 'mhs@example.com',
      });

      const result = await strategy.validate({
        sub: 'uuid-123',
        email: 'mhs@example.com',
      });

      expect(result).toEqual({
        id: 'uuid-123',
        email: 'mhs@example.com',
        role: 'mahasiswa',
        mahasiswaId: 1n,
      });
    });

    it('should return reviewer user when reviewer profile found', async () => {
      mockPrismaService.mahasiswa.findUnique.mockResolvedValueOnce(null);
      mockPrismaService.reviewerUser.findUnique.mockResolvedValueOnce({
        id: 2n,
        email: 'reviewer@example.com',
      });

      const result = await strategy.validate({
        sub: 'uuid-456',
        email: 'reviewer@example.com',
      });

      expect(result).toEqual({
        id: 'uuid-456',
        email: 'reviewer@example.com',
        role: 'reviewer',
        reviewerUserId: 2n,
      });
    });

    it('should return admin user when no profile found and role is admin', async () => {
      mockPrismaService.mahasiswa.findUnique.mockResolvedValueOnce(null);
      mockPrismaService.reviewerUser.findUnique.mockResolvedValueOnce(null);

      const result = await strategy.validate({
        sub: 'uuid-789',
        email: 'admin@example.com',
        role: 'admin',
      });

      expect(result).toEqual({
        id: 'uuid-789',
        email: 'admin@example.com',
        role: 'admin',
      });
    });

    it('should default to admin when no profile and no role in payload', async () => {
      mockPrismaService.mahasiswa.findUnique.mockResolvedValueOnce(null);
      mockPrismaService.reviewerUser.findUnique.mockResolvedValueOnce(null);

      const result = await strategy.validate({
        sub: 'uuid-000',
        email: 'unknown@example.com',
      });

      expect(result).toEqual({
        id: 'uuid-000',
        email: 'unknown@example.com',
        role: 'admin',
      });
    });
  });
});
