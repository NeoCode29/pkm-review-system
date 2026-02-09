import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';
import { SupabaseService } from './supabase.service';

const mockPrismaService = {
  mahasiswa: {
    findUnique: jest.fn(),
    create: jest.fn(),
  },
  reviewerUser: {
    findUnique: jest.fn(),
  },
  jurusan: {
    findUnique: jest.fn(),
  },
  programStudi: {
    findUnique: jest.fn(),
  },
};

const mockSupabaseClient = {
  auth: {
    admin: {
      createUser: jest.fn(),
      deleteUser: jest.fn(),
    },
    signInWithPassword: jest.fn(),
  },
};

const mockSupabaseService = {
  getClient: jest.fn().mockReturnValue(mockSupabaseClient),
  getAdminClient: jest.fn().mockReturnValue(mockSupabaseClient),
};

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: SupabaseService, useValue: mockSupabaseService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('registerMahasiswa', () => {
    const registerDto = {
      email: 'test@example.com',
      password: 'Password123!',
      nama: 'Test User',
      nim: '123456789012',
      noHp: '081234567890',
      jurusanId: '1',
      programStudiId: '1',
    };

    it('should throw ConflictException if NIM already exists', async () => {
      mockPrismaService.mahasiswa.findUnique.mockResolvedValueOnce({ id: 1n });

      await expect(service.registerMahasiswa(registerDto)).rejects.toThrow(
        new ConflictException('NIM sudah terdaftar'),
      );
    });

    it('should throw ConflictException if email already exists', async () => {
      mockPrismaService.mahasiswa.findUnique
        .mockResolvedValueOnce(null) // NIM check
        .mockResolvedValueOnce({ id: 1n }); // email check

      await expect(service.registerMahasiswa(registerDto)).rejects.toThrow(
        ConflictException,
      );
    });

    it('should throw BadRequestException if jurusan not found', async () => {
      mockPrismaService.mahasiswa.findUnique.mockResolvedValue(null);
      mockPrismaService.jurusan.findUnique.mockResolvedValueOnce(null);

      await expect(service.registerMahasiswa(registerDto)).rejects.toThrow(
        new BadRequestException('Jurusan tidak ditemukan'),
      );
    });

    it('should throw BadRequestException if program studi not found', async () => {
      mockPrismaService.mahasiswa.findUnique.mockResolvedValue(null);
      mockPrismaService.jurusan.findUnique.mockResolvedValueOnce({ id: 1n });
      mockPrismaService.programStudi.findUnique.mockResolvedValueOnce(null);

      await expect(service.registerMahasiswa(registerDto)).rejects.toThrow(
        new BadRequestException('Program Studi tidak ditemukan'),
      );
    });

    it('should throw BadRequestException if Supabase auth fails', async () => {
      mockPrismaService.mahasiswa.findUnique.mockResolvedValue(null);
      mockPrismaService.jurusan.findUnique.mockResolvedValueOnce({ id: 1n });
      mockPrismaService.programStudi.findUnique.mockResolvedValueOnce({ id: 1n });
      mockSupabaseClient.auth.admin.createUser.mockResolvedValueOnce({
        data: null,
        error: { message: 'Auth error' },
      });

      await expect(service.registerMahasiswa(registerDto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should register mahasiswa successfully', async () => {
      mockPrismaService.mahasiswa.findUnique.mockResolvedValue(null);
      mockPrismaService.jurusan.findUnique.mockResolvedValueOnce({ id: 1n });
      mockPrismaService.programStudi.findUnique.mockResolvedValueOnce({ id: 1n });
      mockSupabaseClient.auth.admin.createUser.mockResolvedValueOnce({
        data: { user: { id: 'uuid-123', email: 'test@example.com' } },
        error: null,
      });
      mockPrismaService.mahasiswa.create.mockResolvedValueOnce({
        id: 1n,
        nama: 'Test User',
        nim: '123456789012',
      });

      const result = await service.registerMahasiswa(registerDto);

      expect(result).toEqual({
        user: { id: 'uuid-123', email: 'test@example.com' },
        mahasiswa: { id: '1', nama: 'Test User', nim: '123456789012' },
      });
      expect(mockSupabaseClient.auth.admin.createUser).toHaveBeenCalledTimes(1);
      expect(mockPrismaService.mahasiswa.create).toHaveBeenCalledTimes(1);
    });

    it('should rollback Supabase user if DB creation fails', async () => {
      mockPrismaService.mahasiswa.findUnique.mockResolvedValue(null);
      mockPrismaService.jurusan.findUnique.mockResolvedValueOnce({ id: 1n });
      mockPrismaService.programStudi.findUnique.mockResolvedValueOnce({ id: 1n });
      mockSupabaseClient.auth.admin.createUser.mockResolvedValueOnce({
        data: { user: { id: 'uuid-123', email: 'test@example.com' } },
        error: null,
      });
      mockPrismaService.mahasiswa.create.mockRejectedValueOnce(new Error('DB error'));

      await expect(service.registerMahasiswa(registerDto)).rejects.toThrow(
        BadRequestException,
      );
      expect(mockSupabaseClient.auth.admin.deleteUser).toHaveBeenCalledWith('uuid-123');
    });
  });

  describe('login', () => {
    const loginDto = { email: 'test@example.com', password: 'Password123!' };

    it('should throw UnauthorizedException on invalid credentials', async () => {
      mockSupabaseClient.auth.signInWithPassword.mockResolvedValueOnce({
        data: null,
        error: { message: 'Invalid login credentials' },
      });

      await expect(service.login(loginDto)).rejects.toThrow(
        new UnauthorizedException('Email atau password salah'),
      );
    });

    it('should login as mahasiswa', async () => {
      mockSupabaseClient.auth.signInWithPassword.mockResolvedValueOnce({
        data: {
          user: { id: 'uuid-123', email: 'test@example.com' },
          session: { access_token: 'token-abc', refresh_token: 'refresh-abc' },
        },
        error: null,
      });
      mockPrismaService.mahasiswa.findUnique.mockResolvedValueOnce({
        id: 1n,
        nama: 'Test User',
        nim: '123456789012',
      });

      const result = await service.login(loginDto);

      expect(result.user.role).toBe('mahasiswa');
      expect(result.access_token).toBe('token-abc');
      expect(result.profile).toEqual({
        id: '1',
        nama: 'Test User',
        nim: '123456789012',
      });
    });

    it('should login as reviewer', async () => {
      mockSupabaseClient.auth.signInWithPassword.mockResolvedValueOnce({
        data: {
          user: { id: 'uuid-456', email: 'reviewer@example.com' },
          session: { access_token: 'token-def', refresh_token: 'refresh-def' },
        },
        error: null,
      });
      mockPrismaService.mahasiswa.findUnique.mockResolvedValueOnce(null);
      mockPrismaService.reviewerUser.findUnique.mockResolvedValueOnce({
        id: 2n,
        nama: 'Reviewer User',
        nidn: '001122',
      });

      const result = await service.login(loginDto);

      expect(result.user.role).toBe('reviewer');
      expect(result.profile).toEqual({
        id: '2',
        nama: 'Reviewer User',
        nidn: '001122',
      });
    });

    it('should login as admin when no profile found', async () => {
      mockSupabaseClient.auth.signInWithPassword.mockResolvedValueOnce({
        data: {
          user: { id: 'uuid-789', email: 'admin@example.com' },
          session: { access_token: 'token-ghi', refresh_token: 'refresh-ghi' },
        },
        error: null,
      });
      mockPrismaService.mahasiswa.findUnique.mockResolvedValueOnce(null);
      mockPrismaService.reviewerUser.findUnique.mockResolvedValueOnce(null);

      const result = await service.login(loginDto);

      expect(result.user.role).toBe('admin');
      expect(result.profile).toBeNull();
    });
  });

  describe('getProfile', () => {
    it('should return mahasiswa profile', async () => {
      mockPrismaService.mahasiswa.findUnique.mockResolvedValueOnce({
        id: 1n,
        nama: 'Test',
        jurusan: { nama: 'TI' },
        programStudi: { nama: 'Informatika' },
      });

      const result = await service.getProfile('uuid-123');

      expect(result.role).toBe('mahasiswa');
      expect(result.profile).toBeDefined();
    });

    it('should return reviewer profile', async () => {
      mockPrismaService.mahasiswa.findUnique.mockResolvedValueOnce(null);
      mockPrismaService.reviewerUser.findUnique.mockResolvedValueOnce({
        id: 2n,
        nama: 'Reviewer',
      });

      const result = await service.getProfile('uuid-456');

      expect(result.role).toBe('reviewer');
      expect(result.profile).toBeDefined();
    });

    it('should return admin when no profile found', async () => {
      mockPrismaService.mahasiswa.findUnique.mockResolvedValueOnce(null);
      mockPrismaService.reviewerUser.findUnique.mockResolvedValueOnce(null);

      const result = await service.getProfile('uuid-789');

      expect(result.role).toBe('admin');
      expect(result.profile).toBeNull();
    });
  });
});
