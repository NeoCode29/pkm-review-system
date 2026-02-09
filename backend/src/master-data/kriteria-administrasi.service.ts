import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateKriteriaAdministrasiDto,
  UpdateKriteriaAdministrasiDto,
} from './dto/kriteria-administrasi.dto';

@Injectable()
export class KriteriaAdministrasiService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateKriteriaAdministrasiDto, userId?: string) {
    const jenisPkm = await this.prisma.jenisPkm.findUnique({
      where: { id: BigInt(dto.jenisPkmId) },
    });
    if (!jenisPkm) {
      throw new BadRequestException('Jenis PKM tidak ditemukan');
    }

    return this.prisma.kriteriaAdministrasi.create({
      data: {
        jenisPkmId: BigInt(dto.jenisPkmId),
        deskripsi: dto.deskripsi,
        urutan: dto.urutan,
        createdBy: userId,
      },
    });
  }

  async findByJenisPkm(jenisPkmId: bigint) {
    return this.prisma.kriteriaAdministrasi.findMany({
      where: { jenisPkmId },
      orderBy: { urutan: 'asc' },
    });
  }

  async findOne(id: bigint) {
    const kriteria = await this.prisma.kriteriaAdministrasi.findUnique({
      where: { id },
      include: { jenisPkm: { select: { id: true, nama: true } } },
    });
    if (!kriteria) {
      throw new NotFoundException('Kriteria Administrasi tidak ditemukan');
    }
    return kriteria;
  }

  async update(id: bigint, dto: UpdateKriteriaAdministrasiDto, userId?: string) {
    await this.findOne(id);

    const data: any = { updatedBy: userId };
    if (dto.deskripsi) data.deskripsi = dto.deskripsi;
    if (dto.urutan !== undefined) data.urutan = dto.urutan;
    if (dto.jenisPkmId) {
      const jenisPkm = await this.prisma.jenisPkm.findUnique({
        where: { id: BigInt(dto.jenisPkmId) },
      });
      if (!jenisPkm) {
        throw new BadRequestException('Jenis PKM tidak ditemukan');
      }
      data.jenisPkmId = BigInt(dto.jenisPkmId);
    }

    return this.prisma.kriteriaAdministrasi.update({ where: { id }, data });
  }

  async remove(id: bigint) {
    await this.findOne(id);
    return this.prisma.kriteriaAdministrasi.delete({ where: { id } });
  }
}
