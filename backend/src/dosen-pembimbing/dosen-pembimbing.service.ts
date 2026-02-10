import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateDosenPembimbingDto, UpdateDosenPembimbingDto } from './dto/dosen-pembimbing.dto';

@Injectable()
export class DosenPembimbingService {
  constructor(private readonly prisma: PrismaService) {}

  async findOrCreate(dto: CreateDosenPembimbingDto, userId?: string) {
    const existing = await this.prisma.dosenPembimbing.findFirst({
      where: { nama: { equals: dto.nama, mode: 'insensitive' } },
    });
    if (existing) {
      return this.prisma.dosenPembimbing.update({
        where: { id: existing.id },
        data: { nidn: dto.nidn, email: dto.email, noHp: dto.noHp, updatedBy: userId },
      });
    }

    return this.prisma.dosenPembimbing.create({
      data: { nama: dto.nama, nidn: dto.nidn, email: dto.email, noHp: dto.noHp, createdBy: userId },
    });
  }

  async create(dto: CreateDosenPembimbingDto, userId?: string) {
    return this.prisma.dosenPembimbing.create({
      data: { nama: dto.nama, nidn: dto.nidn, email: dto.email, noHp: dto.noHp, createdBy: userId },
    });
  }

  async findAll(search?: string) {
    const where = search
      ? { nama: { contains: search, mode: 'insensitive' as const } }
      : {};
    return this.prisma.dosenPembimbing.findMany({
      where,
      orderBy: { nama: 'asc' },
      include: { _count: { select: { teams: true } } },
    });
  }

  async findOne(id: bigint) {
    const dosen = await this.prisma.dosenPembimbing.findUnique({
      where: { id },
      include: { teams: { select: { id: true, namaTeam: true, status: true } } },
    });
    if (!dosen) throw new NotFoundException('Dosen Pembimbing tidak ditemukan');
    return dosen;
  }

  async update(id: bigint, dto: UpdateDosenPembimbingDto, userId?: string) {
    await this.findOne(id);
    return this.prisma.dosenPembimbing.update({
      where: { id },
      data: { ...dto, updatedBy: userId },
    });
  }

  async remove(id: bigint) {
    await this.findOne(id);
    return this.prisma.dosenPembimbing.delete({ where: { id } });
  }
}
