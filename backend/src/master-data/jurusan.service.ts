import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateJurusanDto, UpdateJurusanDto } from './dto/jurusan.dto';

@Injectable()
export class JurusanService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateJurusanDto, userId?: string) {
    const existing = await this.prisma.jurusan.findUnique({
      where: { nama: dto.nama },
    });
    if (existing) {
      throw new ConflictException(`Jurusan "${dto.nama}" sudah ada`);
    }

    return this.prisma.jurusan.create({
      data: {
        nama: dto.nama,
        createdBy: userId,
      },
    });
  }

  async findAll() {
    return this.prisma.jurusan.findMany({
      orderBy: { nama: 'asc' },
      include: { _count: { select: { programStudi: true, mahasiswa: true } } },
    });
  }

  async findOne(id: bigint) {
    const jurusan = await this.prisma.jurusan.findUnique({
      where: { id },
      include: {
        programStudi: { orderBy: { nama: 'asc' } },
        _count: { select: { mahasiswa: true } },
      },
    });
    if (!jurusan) {
      throw new NotFoundException('Jurusan tidak ditemukan');
    }
    return jurusan;
  }

  async update(id: bigint, dto: UpdateJurusanDto, userId?: string) {
    await this.findOne(id);

    if (dto.nama) {
      const existing = await this.prisma.jurusan.findFirst({
        where: { nama: dto.nama, NOT: { id } },
      });
      if (existing) {
        throw new ConflictException(`Jurusan "${dto.nama}" sudah ada`);
      }
    }

    return this.prisma.jurusan.update({
      where: { id },
      data: {
        ...dto,
        updatedBy: userId,
      },
    });
  }

  async remove(id: bigint) {
    await this.findOne(id);
    return this.prisma.jurusan.delete({ where: { id } });
  }
}
