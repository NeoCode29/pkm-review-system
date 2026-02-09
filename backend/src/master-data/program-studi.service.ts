import {
  Injectable,
  ConflictException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProgramStudiDto, UpdateProgramStudiDto } from './dto/program-studi.dto';

@Injectable()
export class ProgramStudiService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateProgramStudiDto, userId?: string) {
    const jurusan = await this.prisma.jurusan.findUnique({
      where: { id: BigInt(dto.jurusanId) },
    });
    if (!jurusan) {
      throw new BadRequestException('Jurusan tidak ditemukan');
    }

    const existing = await this.prisma.programStudi.findFirst({
      where: { jurusanId: BigInt(dto.jurusanId), nama: dto.nama },
    });
    if (existing) {
      throw new ConflictException(
        `Program Studi "${dto.nama}" sudah ada di jurusan ini`,
      );
    }

    return this.prisma.programStudi.create({
      data: {
        nama: dto.nama,
        jurusanId: BigInt(dto.jurusanId),
        createdBy: userId,
      },
    });
  }

  async findAll(jurusanId?: string) {
    const where = jurusanId ? { jurusanId: BigInt(jurusanId) } : {};
    return this.prisma.programStudi.findMany({
      where,
      orderBy: { nama: 'asc' },
      include: {
        jurusan: { select: { id: true, nama: true } },
        _count: { select: { mahasiswa: true } },
      },
    });
  }

  async findOne(id: bigint) {
    const prodi = await this.prisma.programStudi.findUnique({
      where: { id },
      include: {
        jurusan: { select: { id: true, nama: true } },
        _count: { select: { mahasiswa: true } },
      },
    });
    if (!prodi) {
      throw new NotFoundException('Program Studi tidak ditemukan');
    }
    return prodi;
  }

  async update(id: bigint, dto: UpdateProgramStudiDto, userId?: string) {
    await this.findOne(id);

    const data: any = { updatedBy: userId };
    if (dto.nama) data.nama = dto.nama;
    if (dto.jurusanId) {
      const jurusan = await this.prisma.jurusan.findUnique({
        where: { id: BigInt(dto.jurusanId) },
      });
      if (!jurusan) {
        throw new BadRequestException('Jurusan tidak ditemukan');
      }
      data.jurusanId = BigInt(dto.jurusanId);
    }

    if (dto.nama || dto.jurusanId) {
      const checkJurusanId = dto.jurusanId
        ? BigInt(dto.jurusanId)
        : (await this.prisma.programStudi.findUnique({ where: { id } }))!.jurusanId;
      const checkNama = dto.nama
        || (await this.prisma.programStudi.findUnique({ where: { id } }))!.nama;

      const existing = await this.prisma.programStudi.findFirst({
        where: { jurusanId: checkJurusanId, nama: checkNama, NOT: { id } },
      });
      if (existing) {
        throw new ConflictException(
          `Program Studi "${checkNama}" sudah ada di jurusan ini`,
        );
      }
    }

    return this.prisma.programStudi.update({ where: { id }, data });
  }

  async remove(id: bigint) {
    await this.findOne(id);
    return this.prisma.programStudi.delete({ where: { id } });
  }
}
