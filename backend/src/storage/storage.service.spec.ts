import { Test, TestingModule } from '@nestjs/testing';
import { InternalServerErrorException } from '@nestjs/common';
import { StorageService } from './storage.service';
import { SupabaseService } from '../auth/supabase.service';

const mockStorageBucket = {
  upload: jest.fn(),
  createSignedUrl: jest.fn(),
  download: jest.fn(),
  remove: jest.fn(),
};

const mockClient = {
  storage: { from: jest.fn(() => mockStorageBucket) },
};

const mockSupabaseService = {
  getClient: jest.fn(() => mockClient),
};

describe('StorageService', () => {
  let service: StorageService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StorageService,
        { provide: SupabaseService, useValue: mockSupabaseService },
      ],
    }).compile();

    service = module.get<StorageService>(StorageService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('upload', () => {
    it('should upload file and return path', async () => {
      mockStorageBucket.upload.mockResolvedValueOnce({
        data: { path: 'original/1/test.pdf' },
        error: null,
      });

      const result = await service.upload('original/1/test.pdf', Buffer.from('test'), 'application/pdf');
      expect(result).toBe('original/1/test.pdf');
    });

    it('should throw on upload error', async () => {
      mockStorageBucket.upload.mockResolvedValueOnce({
        data: null,
        error: { message: 'Upload failed' },
      });

      await expect(
        service.upload('path', Buffer.from('test'), 'application/pdf'),
      ).rejects.toThrow(InternalServerErrorException);
    });
  });

  describe('getSignedUrl', () => {
    it('should return signed URL', async () => {
      mockStorageBucket.createSignedUrl.mockResolvedValueOnce({
        data: { signedUrl: 'https://example.com/signed' },
        error: null,
      });

      const result = await service.getSignedUrl('original/1/test.pdf');
      expect(result).toBe('https://example.com/signed');
    });

    it('should throw on error', async () => {
      mockStorageBucket.createSignedUrl.mockResolvedValueOnce({
        data: null,
        error: { message: 'Failed' },
      });

      await expect(service.getSignedUrl('path')).rejects.toThrow(InternalServerErrorException);
    });
  });

  describe('download', () => {
    it('should return file buffer', async () => {
      const blob = { arrayBuffer: jest.fn().mockResolvedValueOnce(new ArrayBuffer(4)) };
      mockStorageBucket.download.mockResolvedValueOnce({ data: blob, error: null });

      const result = await service.download('original/1/test.pdf');
      expect(result).toBeInstanceOf(Buffer);
    });

    it('should throw on error', async () => {
      mockStorageBucket.download.mockResolvedValueOnce({
        data: null,
        error: { message: 'Failed' },
      });

      await expect(service.download('path')).rejects.toThrow(InternalServerErrorException);
    });
  });

  describe('buildPath', () => {
    it('should build correct path', () => {
      const path = service.buildPath('original', 1n, 'my proposal.pdf');
      expect(path).toMatch(/^original\/1\/\d+_my_proposal\.pdf$/);
    });

    it('should sanitize filename', () => {
      const path = service.buildPath('revised', 2n, 'file (1) [draft].pdf');
      expect(path).toMatch(/^revised\/2\/\d+_file__1___draft_.pdf$/);
    });
  });
});
