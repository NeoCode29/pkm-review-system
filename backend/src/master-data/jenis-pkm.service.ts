import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateJenisPkmDto, UpdateJenisPkmDto } from './dto/jenis-pkm.dto';

@Injectable()
export class JenisPkmService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateJenisPkmDto, userId?: string) {
    const existingNama = await this.prisma.jenisPkm.findUnique({
      where: { nama: dto.nama },
    });
    if (existingNama) {
      throw new ConflictException(`Jenis PKM "${dto.nama}" sudah ada`);
    }

    if (dto.kode) {
      const existingKode = await this.prisma.jenisPkm.findUnique({
        where: { kode: dto.kode },
      });
      if (existingKode) {
        throw new ConflictException(`Kode "${dto.kode}" sudah digunakan`);
      }
    }

    return this.prisma.jenisPkm.create({
      data: {
        nama: dto.nama,
        kode: dto.kode,
        deskripsi: dto.deskripsi,
        createdBy: userId,
      },
    });
  }

  async findAll() {
    return this.prisma.jenisPkm.findMany({
      orderBy: { nama: 'asc' },
      include: {
        _count: {
          select: {
            teams: true,
            kriteriaAdministrasi: true,
            kriteriaSubstansi: true,
          },
        },
      },
    });
  }

  async findOne(id: bigint) {
    const jenisPkm = await this.prisma.jenisPkm.findUnique({
      where: { id },
      include: {
        kriteriaAdministrasi: { orderBy: { urutan: 'asc' } },
        kriteriaSubstansi: { orderBy: { urutan: 'asc' } },
        _count: { select: { teams: true } },
      },
    });
    if (!jenisPkm) {
      throw new NotFoundException('Jenis PKM tidak ditemukan');
    }
    return jenisPkm;
  }

  async update(id: bigint, dto: UpdateJenisPkmDto, userId?: string) {
    await this.findOne(id);

    if (dto.nama) {
      const existing = await this.prisma.jenisPkm.findFirst({
        where: { nama: dto.nama, NOT: { id } },
      });
      if (existing) {
        throw new ConflictException(`Jenis PKM "${dto.nama}" sudah ada`);
      }
    }

    if (dto.kode) {
      const existing = await this.prisma.jenisPkm.findFirst({
        where: { kode: dto.kode, NOT: { id } },
      });
      if (existing) {
        throw new ConflictException(`Kode "${dto.kode}" sudah digunakan`);
      }
    }

    return this.prisma.jenisPkm.update({
      where: { id },
      data: {
        ...dto,
        updatedBy: userId,
      },
    });
  }

  async remove(id: bigint) {
    await this.findOne(id);
    return this.prisma.jenisPkm.delete({ where: { id } });
  }
}
