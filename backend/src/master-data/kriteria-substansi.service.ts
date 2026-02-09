import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateKriteriaSubstansiDto,
  UpdateKriteriaSubstansiDto,
} from './dto/kriteria-substansi.dto';

@Injectable()
export class KriteriaSubstansiService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateKriteriaSubstansiDto, userId?: string) {
    const jenisPkm = await this.prisma.jenisPkm.findUnique({
      where: { id: BigInt(dto.jenisPkmId) },
    });
    if (!jenisPkm) {
      throw new BadRequestException('Jenis PKM tidak ditemukan');
    }

    // Validate bobot total <= 100
    await this.validateBobotTotal(BigInt(dto.jenisPkmId), dto.bobot);

    return this.prisma.kriteriaSubstansi.create({
      data: {
        jenisPkmId: BigInt(dto.jenisPkmId),
        nama: dto.nama,
        deskripsi: dto.deskripsi,
        skorMin: dto.skorMin ?? 0,
        skorMax: dto.skorMax,
        bobot: dto.bobot,
        urutan: dto.urutan,
        createdBy: userId,
      },
    });
  }

  async findByJenisPkm(jenisPkmId: bigint) {
    return this.prisma.kriteriaSubstansi.findMany({
      where: { jenisPkmId },
      orderBy: { urutan: 'asc' },
    });
  }

  async findOne(id: bigint) {
    const kriteria = await this.prisma.kriteriaSubstansi.findUnique({
      where: { id },
      include: { jenisPkm: { select: { id: true, nama: true } } },
    });
    if (!kriteria) {
      throw new NotFoundException('Kriteria Substansi tidak ditemukan');
    }
    return kriteria;
  }

  async update(id: bigint, dto: UpdateKriteriaSubstansiDto, userId?: string) {
    await this.findOne(id);

    const data: any = { updatedBy: userId };
    if (dto.nama) data.nama = dto.nama;
    if (dto.deskripsi !== undefined) data.deskripsi = dto.deskripsi;
    if (dto.skorMin !== undefined) data.skorMin = dto.skorMin;
    if (dto.skorMax !== undefined) data.skorMax = dto.skorMax;
    if (dto.bobot !== undefined) data.bobot = dto.bobot;
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

    // Validate bobot total if bobot is being changed
    if (dto.bobot !== undefined) {
      const existing = await this.prisma.kriteriaSubstansi.findUnique({ where: { id } });
      if (existing) {
        await this.validateBobotTotal(
          dto.jenisPkmId ? BigInt(dto.jenisPkmId) : existing.jenisPkmId,
          dto.bobot,
          id,
        );
      }
    }

    return this.prisma.kriteriaSubstansi.update({ where: { id }, data });
  }

  private async validateBobotTotal(jenisPkmId: bigint, newBobot: number, excludeId?: bigint) {
    const existing = await this.prisma.kriteriaSubstansi.findMany({
      where: {
        jenisPkmId,
        ...(excludeId ? { id: { not: excludeId } } : {}),
      },
    });
    const currentTotal = existing.reduce((sum, k) => sum + (k.bobot ?? 0), 0);
    const projectedTotal = currentTotal + newBobot;

    if (projectedTotal > 100) {
      throw new BadRequestException(
        `Total bobot melebihi 100. Saat ini: ${currentTotal}, ditambah ${newBobot} = ${projectedTotal}`,
      );
    }
  }

  async remove(id: bigint) {
    await this.findOne(id);
    return this.prisma.kriteriaSubstansi.delete({ where: { id } });
  }
}
