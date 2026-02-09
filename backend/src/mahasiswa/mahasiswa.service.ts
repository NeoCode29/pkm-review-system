import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateMahasiswaDto } from './dto/mahasiswa.dto';

@Injectable()
export class MahasiswaService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(search?: string) {
    const where = search
      ? {
          OR: [
            { nama: { contains: search, mode: 'insensitive' as const } },
            { nim: { contains: search } },
            { email: { contains: search, mode: 'insensitive' as const } },
          ],
        }
      : {};

    return this.prisma.mahasiswa.findMany({
      where,
      orderBy: { nama: 'asc' },
      include: {
        jurusan: { select: { id: true, nama: true } },
        programStudi: { select: { id: true, nama: true } },
      },
    });
  }

  async findOne(id: bigint) {
    const mahasiswa = await this.prisma.mahasiswa.findUnique({
      where: { id },
      include: {
        jurusan: { select: { id: true, nama: true } },
        programStudi: { select: { id: true, nama: true } },
        teamMembers: {
          include: {
            team: {
              include: {
                jenisPkm: { select: { id: true, nama: true } },
                _count: { select: { teamMembers: true } },
              },
            },
          },
        },
      },
    });
    if (!mahasiswa) {
      throw new NotFoundException('Mahasiswa tidak ditemukan');
    }
    return mahasiswa;
  }

  async findByUserId(userId: string) {
    const mahasiswa = await this.prisma.mahasiswa.findUnique({
      where: { userId },
      include: {
        jurusan: { select: { id: true, nama: true } },
        programStudi: { select: { id: true, nama: true } },
      },
    });
    if (!mahasiswa) {
      throw new NotFoundException('Mahasiswa profile tidak ditemukan');
    }
    return mahasiswa;
  }

  async update(id: bigint, dto: UpdateMahasiswaDto, userId?: string) {
    await this.findOne(id);
    return this.prisma.mahasiswa.update({
      where: { id },
      data: { ...dto, updatedBy: userId },
    });
  }

  async getDashboard(userId: string) {
    const mahasiswa = await this.prisma.mahasiswa.findUnique({
      where: { userId },
      include: {
        teamMembers: {
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
                proposals: {
                  include: {
                    proposalFiles: { orderBy: { uploadedAt: 'desc' }, take: 1 },
                  },
                },
                _count: { select: { teamMembers: true } },
              },
            },
          },
        },
      },
    });

    if (!mahasiswa) {
      throw new NotFoundException('Mahasiswa tidak ditemukan');
    }

    const teamMember = mahasiswa.teamMembers[0] || null;

    return {
      hasTeam: !!teamMember,
      team: teamMember?.team || null,
      proposals: teamMember?.team?.proposals || [],
    };
  }
}
