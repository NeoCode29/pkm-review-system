import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTeamDto, UpdateTeamDto, AddMemberDto } from './dto/team.dto';

@Injectable()
export class TeamsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateTeamDto, userId: string) {
    // Find mahasiswa by userId
    const mahasiswa = await this.prisma.mahasiswa.findUnique({
      where: { userId },
    });
    if (!mahasiswa) {
      throw new BadRequestException('Mahasiswa profile tidak ditemukan');
    }

    // Check one team per mahasiswa
    const existingMember = await this.prisma.teamMember.findFirst({
      where: { mahasiswaId: mahasiswa.id },
    });
    if (existingMember) {
      throw new ConflictException('Mahasiswa sudah tergabung dalam tim lain');
    }

    // Validate jenis PKM
    const jenisPkm = await this.prisma.jenisPkm.findUnique({
      where: { id: BigInt(dto.jenisPkmId) },
    });
    if (!jenisPkm) {
      throw new BadRequestException('Jenis PKM tidak ditemukan');
    }

    // Validate dosen pembimbing if provided
    if (dto.dosenPembimbingId) {
      const dosen = await this.prisma.dosenPembimbing.findUnique({
        where: { id: BigInt(dto.dosenPembimbingId) },
      });
      if (!dosen) {
        throw new BadRequestException('Dosen Pembimbing tidak ditemukan');
      }
    }

    // Create team with creator as ketua + auto-create 2 proposals (original + revised)
    return this.prisma.$transaction(async (tx) => {
      const team = await tx.team.create({
        data: {
          namaTeam: dto.namaTeam,
          judulProposal: dto.judulProposal,
          jenisPkmId: BigInt(dto.jenisPkmId),
          dosenPembimbingId: dto.dosenPembimbingId
            ? BigInt(dto.dosenPembimbingId)
            : null,
          createdBy: userId,
        },
      });

      // Add creator as ketua
      await tx.teamMember.create({
        data: {
          teamId: team.id,
          mahasiswaId: mahasiswa.id,
          role: 'ketua',
        },
      });

      // Auto-create 2 proposals
      await tx.proposal.createMany({
        data: [
          { teamId: team.id, type: 'original', createdBy: userId },
          { teamId: team.id, type: 'revised', createdBy: userId },
        ],
      });

      return tx.team.findUnique({
        where: { id: team.id },
        include: {
          jenisPkm: { select: { id: true, nama: true } },
          dosenPembimbing: { select: { id: true, nama: true } },
          teamMembers: {
            include: {
              mahasiswa: { select: { id: true, nama: true, nim: true } },
            },
          },
          proposals: true,
          _count: { select: { teamMembers: true } },
        },
      });
    });
  }

  async findAll() {
    return this.prisma.team.findMany({
      where: { status: 'active' },
      orderBy: { createdAt: 'desc' },
      include: {
        jenisPkm: { select: { id: true, nama: true } },
        dosenPembimbing: { select: { id: true, nama: true } },
        _count: { select: { teamMembers: true } },
      },
    });
  }

  async findOne(id: bigint) {
    const team = await this.prisma.team.findUnique({
      where: { id },
      include: {
        jenisPkm: { select: { id: true, nama: true } },
        dosenPembimbing: { select: { id: true, nama: true } },
        teamMembers: {
          include: {
            mahasiswa: {
              select: { id: true, nama: true, nim: true, email: true },
            },
          },
          orderBy: { joinedAt: 'asc' },
        },
        proposals: {
          include: {
            proposalFiles: { orderBy: { uploadedAt: 'desc' }, take: 1 },
            _count: { select: { reviewerAssignments: true } },
          },
        },
        _count: { select: { teamMembers: true } },
      },
    });
    if (!team) {
      throw new NotFoundException('Tim tidak ditemukan');
    }
    return team;
  }

  async update(id: bigint, dto: UpdateTeamDto, userId: string) {
    const team = await this.findOne(id);

    // Verify user is team member
    await this.verifyTeamMember(id, userId);

    const data: any = { updatedBy: userId };
    if (dto.namaTeam) data.namaTeam = dto.namaTeam;
    if (dto.judulProposal) data.judulProposal = dto.judulProposal;
    if (dto.openToJoin !== undefined) data.openToJoin = dto.openToJoin;
    if (dto.jenisPkmId) {
      const jenisPkm = await this.prisma.jenisPkm.findUnique({
        where: { id: BigInt(dto.jenisPkmId) },
      });
      if (!jenisPkm) throw new BadRequestException('Jenis PKM tidak ditemukan');
      data.jenisPkmId = BigInt(dto.jenisPkmId);
    }
    if (dto.dosenPembimbingId) {
      const dosen = await this.prisma.dosenPembimbing.findUnique({
        where: { id: BigInt(dto.dosenPembimbingId) },
      });
      if (!dosen) throw new BadRequestException('Dosen Pembimbing tidak ditemukan');
      data.dosenPembimbingId = BigInt(dto.dosenPembimbingId);
    }

    return this.prisma.team.update({
      where: { id },
      data,
      include: {
        jenisPkm: { select: { id: true, nama: true } },
        dosenPembimbing: { select: { id: true, nama: true } },
        _count: { select: { teamMembers: true } },
      },
    });
  }

  async remove(id: bigint, userId: string, isAdmin = false) {
    const team = await this.findOne(id);

    if (!isAdmin) {
      await this.verifyTeamMember(id, userId);
    }

    // Return cascade impact count
    const counts = {
      members: team.teamMembers.length,
      proposals: team.proposals.length,
    };

    await this.prisma.team.delete({ where: { id } });

    return { message: 'Tim berhasil dihapus', cascadeImpact: counts };
  }

  // Browse open teams (for mahasiswa without team)
  async browse() {
    return this.prisma.team.findMany({
      where: {
        status: 'active',
        openToJoin: true,
        teamMembers: { some: {} }, // has at least 1 member
      },
      orderBy: { createdAt: 'desc' },
      include: {
        jenisPkm: { select: { id: true, nama: true } },
        teamMembers: {
          include: {
            mahasiswa: { select: { id: true, nama: true, nim: true } },
          },
        },
        _count: { select: { teamMembers: true } },
      },
    });
  }

  // Member management
  async addMember(teamId: bigint, dto: AddMemberDto, userId: string) {
    const team = await this.findOne(teamId);

    // Check max 5 members
    if (team.teamMembers.length >= 5) {
      throw new BadRequestException('Tim sudah penuh (maksimal 5 anggota)');
    }

    const mahasiswaId = BigInt(dto.mahasiswaId);

    // Check one team per mahasiswa
    const existingMember = await this.prisma.teamMember.findFirst({
      where: { mahasiswaId },
    });
    if (existingMember) {
      throw new ConflictException('Mahasiswa sudah tergabung dalam tim lain');
    }

    return this.prisma.teamMember.create({
      data: {
        teamId,
        mahasiswaId,
        role: (dto.role as any) || 'anggota',
      },
      include: {
        mahasiswa: { select: { id: true, nama: true, nim: true } },
      },
    });
  }

  async removeMember(teamId: bigint, memberId: bigint, userId: string) {
    const member = await this.prisma.teamMember.findUnique({
      where: { id: memberId },
    });
    if (!member || member.teamId !== teamId) {
      throw new NotFoundException('Anggota tidak ditemukan di tim ini');
    }

    await this.prisma.teamMember.delete({ where: { id: memberId } });

    // Auto-delete team if 0 members
    const remainingCount = await this.prisma.teamMember.count({
      where: { teamId },
    });
    if (remainingCount === 0) {
      await this.prisma.team.delete({ where: { id: teamId } });
      return { message: 'Anggota dihapus, tim otomatis dihapus karena tidak ada anggota' };
    }

    return { message: 'Anggota berhasil dihapus dari tim' };
  }

  async updateMemberRole(teamId: bigint, memberId: bigint, role: string) {
    const member = await this.prisma.teamMember.findUnique({
      where: { id: memberId },
    });
    if (!member || member.teamId !== teamId) {
      throw new NotFoundException('Anggota tidak ditemukan di tim ini');
    }

    return this.prisma.teamMember.update({
      where: { id: memberId },
      data: { role: role as any },
      include: {
        mahasiswa: { select: { id: true, nama: true, nim: true } },
      },
    });
  }

  // Join requests
  async createJoinRequest(teamId: bigint, userId: string, message?: string) {
    const mahasiswa = await this.prisma.mahasiswa.findUnique({
      where: { userId },
    });
    if (!mahasiswa) {
      throw new BadRequestException('Mahasiswa profile tidak ditemukan');
    }

    // Check one team per mahasiswa
    const existingMember = await this.prisma.teamMember.findFirst({
      where: { mahasiswaId: mahasiswa.id },
    });
    if (existingMember) {
      throw new ConflictException('Anda sudah tergabung dalam tim lain');
    }

    const team = await this.prisma.team.findUnique({
      where: { id: teamId },
      include: { _count: { select: { teamMembers: true } } },
    });
    if (!team) {
      throw new NotFoundException('Tim tidak ditemukan');
    }
    if (!team.openToJoin) {
      throw new BadRequestException('Tim tidak menerima anggota baru');
    }
    if (team._count.teamMembers >= 5) {
      throw new BadRequestException('Tim sudah penuh');
    }

    // Check existing pending request
    const existingRequest = await this.prisma.joinRequest.findFirst({
      where: { teamId, mahasiswaId: mahasiswa.id, status: 'pending' },
    });
    if (existingRequest) {
      throw new ConflictException('Anda sudah mengirim permintaan ke tim ini');
    }

    return this.prisma.joinRequest.create({
      data: {
        teamId,
        mahasiswaId: mahasiswa.id,
        message,
      },
      include: {
        mahasiswa: { select: { id: true, nama: true, nim: true } },
      },
    });
  }

  async getJoinRequests(teamId: bigint) {
    return this.prisma.joinRequest.findMany({
      where: { teamId },
      orderBy: { createdAt: 'desc' },
      include: {
        mahasiswa: {
          select: { id: true, nama: true, nim: true, email: true },
        },
      },
    });
  }

  async approveJoinRequest(requestId: bigint, userId: string) {
    const request = await this.prisma.joinRequest.findUnique({
      where: { id: requestId },
      include: { team: { include: { _count: { select: { teamMembers: true } } } } },
    });
    if (!request) {
      throw new NotFoundException('Permintaan tidak ditemukan');
    }
    if (request.status !== 'pending') {
      throw new BadRequestException('Permintaan sudah diproses');
    }
    if (request.team._count.teamMembers >= 5) {
      throw new BadRequestException('Tim sudah penuh');
    }

    // Check mahasiswa not already in a team
    const existingMember = await this.prisma.teamMember.findFirst({
      where: { mahasiswaId: request.mahasiswaId },
    });
    if (existingMember) {
      // Auto-reject
      await this.prisma.joinRequest.update({
        where: { id: requestId },
        data: { status: 'rejected', respondedBy: userId, respondedAt: new Date() },
      });
      throw new ConflictException('Mahasiswa sudah tergabung dalam tim lain');
    }

    return this.prisma.$transaction(async (tx) => {
      // Update request status
      const updated = await tx.joinRequest.update({
        where: { id: requestId },
        data: { status: 'approved', respondedBy: userId, respondedAt: new Date() },
      });

      // Add as team member
      await tx.teamMember.create({
        data: {
          teamId: request.teamId,
          mahasiswaId: request.mahasiswaId,
          role: 'anggota',
        },
      });

      return updated;
    });
  }

  async rejectJoinRequest(requestId: bigint, userId: string) {
    const request = await this.prisma.joinRequest.findUnique({
      where: { id: requestId },
    });
    if (!request) {
      throw new NotFoundException('Permintaan tidak ditemukan');
    }
    if (request.status !== 'pending') {
      throw new BadRequestException('Permintaan sudah diproses');
    }

    return this.prisma.joinRequest.update({
      where: { id: requestId },
      data: { status: 'rejected', respondedBy: userId, respondedAt: new Date() },
    });
  }

  // Helper: verify user is team member
  private async verifyTeamMember(teamId: bigint, userId: string) {
    const mahasiswa = await this.prisma.mahasiswa.findUnique({
      where: { userId },
    });
    if (!mahasiswa) {
      throw new ForbiddenException('Akses ditolak');
    }

    const member = await this.prisma.teamMember.findFirst({
      where: { teamId, mahasiswaId: mahasiswa.id },
    });
    if (!member) {
      throw new ForbiddenException('Anda bukan anggota tim ini');
    }
    return member;
  }
}
