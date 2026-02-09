import { Test, TestingModule } from '@nestjs/testing';
import {
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { ProposalsService } from './proposals.service';
import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from '../storage/storage.service';

const mockPrisma = {
  proposal: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn(),
  },
  proposalFile: {
    findMany: jest.fn(),
    create: jest.fn(),
  },
  mahasiswa: { findUnique: jest.fn() },
  systemConfig: { findUnique: jest.fn() },
};

const mockStorage = {
  upload: jest.fn(),
  getSignedUrl: jest.fn(),
  download: jest.fn(),
  remove: jest.fn(),
  buildPath: jest.fn(),
};

const createMockFile = (overrides: Partial<Express.Multer.File> = {}): Express.Multer.File => ({
  fieldname: 'file',
  originalname: 'proposal.pdf',
  encoding: '7bit',
  mimetype: 'application/pdf',
  size: 1024,
  buffer: Buffer.from('test'),
  stream: null as any,
  destination: '',
  filename: '',
  path: '',
  ...overrides,
});

describe('ProposalsService', () => {
  let service: ProposalsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProposalsService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: StorageService, useValue: mockStorage },
      ],
    }).compile();

    service = module.get<ProposalsService>(ProposalsService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findOne', () => {
    it('should return proposal by id', async () => {
      mockPrisma.proposal.findUnique.mockResolvedValueOnce({
        id: 1n,
        status: 'draft',
      });
      const result = await service.findOne(1n);
      expect(result.status).toBe('draft');
    });

    it('should throw NotFoundException', async () => {
      mockPrisma.proposal.findUnique.mockResolvedValueOnce(null);
      await expect(service.findOne(99n)).rejects.toThrow(NotFoundException);
    });
  });

  describe('findByTeam', () => {
    it('should return proposals by team', async () => {
      mockPrisma.proposal.findMany.mockResolvedValueOnce([{ id: 1n }, { id: 2n }]);
      const result = await service.findByTeam(1n);
      expect(result).toHaveLength(2);
    });
  });

  describe('submitProposal', () => {
    const mockProposal = {
      id: 1n,
      status: 'draft',
      team: {
        dosenPembimbingId: 1n,
        teamMembers: [{ mahasiswaId: 1n }, { mahasiswaId: 2n }, { mahasiswaId: 3n }],
        _count: { teamMembers: 3 },
      },
      proposalFiles: [{ id: 1n }],
    };

    it('should throw if mahasiswa not found', async () => {
      mockPrisma.proposal.findUnique.mockResolvedValueOnce(mockProposal);
      mockPrisma.mahasiswa.findUnique.mockResolvedValueOnce(null);
      await expect(service.submitProposal(1n, 'u1')).rejects.toThrow(ForbiddenException);
    });

    it('should throw if user not team member', async () => {
      mockPrisma.proposal.findUnique.mockResolvedValueOnce(mockProposal);
      mockPrisma.mahasiswa.findUnique.mockResolvedValueOnce({ id: 99n });
      await expect(service.submitProposal(1n, 'u1')).rejects.toThrow(ForbiddenException);
    });

    it('should throw if team has < 3 members', async () => {
      const smallTeam = {
        ...mockProposal,
        team: {
          ...mockProposal.team,
          teamMembers: [{ mahasiswaId: 1n }],
          _count: { teamMembers: 1 },
        },
      };
      mockPrisma.proposal.findUnique.mockResolvedValueOnce(smallTeam);
      mockPrisma.mahasiswa.findUnique.mockResolvedValueOnce({ id: 1n });
      await expect(service.submitProposal(1n, 'u1')).rejects.toThrow(BadRequestException);
    });

    it('should throw if no dosen pembimbing', async () => {
      const noDosen = {
        ...mockProposal,
        team: { ...mockProposal.team, dosenPembimbingId: null },
      };
      mockPrisma.proposal.findUnique.mockResolvedValueOnce(noDosen);
      mockPrisma.mahasiswa.findUnique.mockResolvedValueOnce({ id: 1n });
      await expect(service.submitProposal(1n, 'u1')).rejects.toThrow(BadRequestException);
    });

    it('should throw if no files uploaded', async () => {
      const noFiles = { ...mockProposal, proposalFiles: [] };
      mockPrisma.proposal.findUnique.mockResolvedValueOnce(noFiles);
      mockPrisma.mahasiswa.findUnique.mockResolvedValueOnce({ id: 1n });
      await expect(service.submitProposal(1n, 'u1')).rejects.toThrow(BadRequestException);
    });

    it('should throw if status is not draft', async () => {
      const submitted = { ...mockProposal, status: 'submitted' };
      mockPrisma.proposal.findUnique.mockResolvedValueOnce(submitted);
      mockPrisma.mahasiswa.findUnique.mockResolvedValueOnce({ id: 1n });
      await expect(service.submitProposal(1n, 'u1')).rejects.toThrow(BadRequestException);
    });

    it('should submit proposal successfully', async () => {
      mockPrisma.proposal.findUnique.mockResolvedValueOnce(mockProposal);
      mockPrisma.mahasiswa.findUnique.mockResolvedValueOnce({ id: 1n });
      mockPrisma.systemConfig.findUnique.mockResolvedValueOnce(null);
      mockPrisma.proposal.update.mockResolvedValueOnce({ id: 1n, status: 'submitted' });

      const result = await service.submitProposal(1n, 'u1');
      expect(result.status).toBe('submitted');
    });
  });

  describe('uploadFile', () => {
    const draftProposal = {
      id: 1n,
      status: 'draft',
      type: 'original',
      teamId: 1n,
      team: { teamMembers: [], _count: { teamMembers: 0 } },
      proposalFiles: [],
    };

    it('should throw if not PDF', async () => {
      mockPrisma.proposal.findUnique.mockResolvedValueOnce(draftProposal);
      const file = createMockFile({ mimetype: 'application/msword', originalname: 'f.doc' });
      await expect(service.uploadFile(1n, file, 'u1')).rejects.toThrow(BadRequestException);
    });

    it('should throw if file > 10MB', async () => {
      mockPrisma.proposal.findUnique.mockResolvedValueOnce(draftProposal);
      const file = createMockFile({ size: 11 * 1024 * 1024 });
      await expect(service.uploadFile(1n, file, 'u1')).rejects.toThrow(BadRequestException);
    });

    it('should throw if status does not allow upload', async () => {
      mockPrisma.proposal.findUnique.mockResolvedValueOnce({ ...draftProposal, status: 'submitted' });
      const file = createMockFile();
      await expect(service.uploadFile(1n, file, 'u1')).rejects.toThrow(BadRequestException);
    });

    it('should throw if upload toggle is off (draft)', async () => {
      mockPrisma.proposal.findUnique.mockResolvedValueOnce(draftProposal);
      mockPrisma.systemConfig.findUnique.mockResolvedValueOnce({
        configKey: 'uploadProposalEnabled',
        configValue: { enabled: false },
      });
      const file = createMockFile();
      await expect(service.uploadFile(1n, file, 'u1')).rejects.toThrow(BadRequestException);
    });

    it('should throw if revision toggle is off (needs_revision)', async () => {
      mockPrisma.proposal.findUnique.mockResolvedValueOnce({
        ...draftProposal,
        status: 'needs_revision',
      });
      mockPrisma.systemConfig.findUnique.mockResolvedValueOnce({
        configKey: 'uploadRevisionEnabled',
        configValue: { enabled: false },
      });
      const file = createMockFile();
      await expect(service.uploadFile(1n, file, 'u1')).rejects.toThrow(BadRequestException);
    });

    it('should upload file to storage and save record', async () => {
      mockPrisma.proposal.findUnique.mockResolvedValueOnce(draftProposal);
      mockPrisma.systemConfig.findUnique.mockResolvedValueOnce(null); // no toggle = allowed
      mockStorage.buildPath.mockReturnValueOnce('original/1/123_proposal.pdf');
      mockStorage.upload.mockResolvedValueOnce('original/1/123_proposal.pdf');
      mockPrisma.proposalFile.create.mockResolvedValueOnce({
        id: 1n,
        fileName: 'proposal.pdf',
        filePath: 'original/1/123_proposal.pdf',
      });

      const file = createMockFile();
      const result = await service.uploadFile(1n, file, 'u1');
      expect(mockStorage.upload).toHaveBeenCalled();
      expect(result.filePath).toBe('original/1/123_proposal.pdf');
    });

    it('should transition needs_revision → revised on upload', async () => {
      mockPrisma.proposal.findUnique.mockResolvedValueOnce({
        ...draftProposal,
        status: 'needs_revision',
      });
      mockPrisma.systemConfig.findUnique.mockResolvedValueOnce(null); // toggle allowed
      mockStorage.buildPath.mockReturnValueOnce('revised/1/123_proposal.pdf');
      mockStorage.upload.mockResolvedValueOnce('revised/1/123_proposal.pdf');
      mockPrisma.proposalFile.create.mockResolvedValueOnce({ id: 2n });
      mockPrisma.proposal.update.mockResolvedValueOnce({ id: 1n, status: 'revised' });

      const file = createMockFile();
      await service.uploadFile(1n, file, 'u1');
      expect(mockPrisma.proposal.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ status: 'revised' }),
        }),
      );
    });
  });

  describe('getFile', () => {
    it('should return latest file', async () => {
      mockPrisma.proposalFile.findMany.mockResolvedValueOnce([{ id: 1n, fileName: 'test.pdf' }]);
      const result = await service.getFile(1n);
      expect(result.fileName).toBe('test.pdf');
    });

    it('should throw if no files', async () => {
      mockPrisma.proposalFile.findMany.mockResolvedValueOnce([]);
      await expect(service.getFile(1n)).rejects.toThrow(NotFoundException);
    });
  });

  describe('getFileDownloadUrl', () => {
    it('should return file info with signed URL', async () => {
      mockPrisma.proposalFile.findMany.mockResolvedValueOnce([
        { id: 1n, fileName: 'test.pdf', filePath: 'original/1/test.pdf' },
      ]);
      mockStorage.getSignedUrl.mockResolvedValueOnce('https://storage.example.com/signed-url');

      const result = await service.getFileDownloadUrl(1n);
      expect(result.downloadUrl).toBe('https://storage.example.com/signed-url');
    });
  });

  describe('downloadFile', () => {
    it('should return buffer and file metadata', async () => {
      mockPrisma.proposalFile.findMany.mockResolvedValueOnce([
        { id: 1n, fileName: 'test.pdf', filePath: 'original/1/test.pdf', mimeType: 'application/pdf' },
      ]);
      mockStorage.download.mockResolvedValueOnce(Buffer.from('pdf-content'));

      const result = await service.downloadFile(1n);
      expect(result.fileName).toBe('test.pdf');
      expect(result.buffer).toBeInstanceOf(Buffer);
    });
  });
});
