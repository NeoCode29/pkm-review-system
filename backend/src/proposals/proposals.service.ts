import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ProposalsService {
  constructor(private readonly prisma: PrismaService) {}

  async findOne(id: bigint) {
    const proposal = await this.prisma.proposal.findUnique({
      where: { id },
      include: {
        team: {
          include: {
            jenisPkm: { select: { id: true, nama: true } },
            dosenPembimbing: { select: { id: true, nama: true } },
            teamMembers: {
              include: {
                mahasiswa: { select: { id: true, nama: true, nim: true } },
              },
            },
            _count: { select: { teamMembers: true } },
          },
        },
        proposalFiles: { orderBy: { uploadedAt: 'desc' } },
        _count: { select: { reviewerAssignments: true } },
      },
    });
    if (!proposal) {
      throw new NotFoundException('Proposal tidak ditemukan');
    }
    return proposal;
  }

  async findByTeam(teamId: bigint) {
    return this.prisma.proposal.findMany({
      where: { teamId },
      include: {
        proposalFiles: { orderBy: { uploadedAt: 'desc' }, take: 1 },
        _count: { select: { reviewerAssignments: true } },
      },
      orderBy: { type: 'asc' },
    });
  }

  async submitProposal(id: bigint, userId: string) {
    const proposal = await this.findOne(id);

    // Verify user is team member
    const mahasiswa = await this.prisma.mahasiswa.findUnique({ where: { userId } });
    if (!mahasiswa) throw new ForbiddenException('Akses ditolak');

    const isMember = proposal.team.teamMembers.some(
      (m) => m.mahasiswaId === mahasiswa.id,
    );
    if (!isMember) throw new ForbiddenException('Anda bukan anggota tim ini');

    // Validate: team >= 3 members
    if (proposal.team._count.teamMembers < 3) {
      throw new BadRequestException('Tim harus memiliki minimal 3 anggota untuk submit');
    }

    // Validate: dosen pembimbing WAJIB
    if (!proposal.team.dosenPembimbingId) {
      throw new BadRequestException('Dosen pembimbing harus diisi sebelum submit');
    }

    // Validate: must have at least one file
    if (proposal.proposalFiles.length === 0) {
      throw new BadRequestException('Upload file proposal terlebih dahulu');
    }

    // Validate status transition: draft → submitted
    if (proposal.status !== 'draft') {
      throw new BadRequestException(`Tidak bisa submit proposal dengan status "${proposal.status}"`);
    }

    // Check upload toggle
    const uploadToggle = await this.prisma.systemConfig.findUnique({
      where: { configKey: 'uploadProposalEnabled' },
    });
    if (uploadToggle && !(uploadToggle.configValue as any)?.enabled) {
      throw new BadRequestException('Pengumpulan proposal sedang ditutup');
    }

    return this.prisma.proposal.update({
      where: { id },
      data: { status: 'submitted', updatedBy: userId },
    });
  }

  async uploadFile(
    proposalId: bigint,
    file: { path: string; filename: string; size: number; mimetype: string },
    userId: string,
  ) {
    const proposal = await this.findOne(proposalId);

    // Validate PDF only
    if (file.mimetype !== 'application/pdf') {
      throw new BadRequestException('Hanya file PDF yang diperbolehkan');
    }

    // Validate max 10MB
    if (file.size > 10 * 1024 * 1024) {
      throw new BadRequestException('Ukuran file maksimal 10MB');
    }

    // Validate status allows upload
    if (!['draft', 'needs_revision'].includes(proposal.status)) {
      throw new BadRequestException(`Tidak bisa upload file pada status "${proposal.status}"`);
    }

    return this.prisma.proposalFile.create({
      data: {
        proposalId,
        filePath: file.path,
        fileName: file.filename,
        fileSize: BigInt(file.size),
        mimeType: file.mimetype,
        uploadedBy: userId,
      },
    });
  }

  async getFile(proposalId: bigint) {
    const files = await this.prisma.proposalFile.findMany({
      where: { proposalId },
      orderBy: { uploadedAt: 'desc' },
      take: 1,
    });
    if (files.length === 0) {
      throw new NotFoundException('File proposal tidak ditemukan');
    }
    return files[0];
  }
}
