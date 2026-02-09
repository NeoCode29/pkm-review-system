import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SupabaseService } from '../auth/supabase.service';
import { PaginationParams, paginate, getPaginationSkip } from '../common/utils/pagination.util';

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly supabaseService: SupabaseService,
  ) {}

  async findAll(
    params: PaginationParams = { page: 1, limit: 20 },
    role?: string,
    search?: string,
  ) {
    const skip = getPaginationSkip(params.page, params.limit);

    // Build search filter
    const searchFilter = search
      ? {
          OR: [
            { nama: { contains: search, mode: 'insensitive' as const } },
            { email: { contains: search, mode: 'insensitive' as const } },
          ],
        }
      : {};

    if (role === 'reviewer') {
      const where = { ...searchFilter };
      const [data, total] = await Promise.all([
        this.prisma.reviewerUser.findMany({
          where,
          orderBy: { nama: 'asc' },
          skip,
          take: params.limit,
          select: { id: true, userId: true, nama: true, email: true, nidn: true, createdAt: true },
        }),
        this.prisma.reviewerUser.count({ where }),
      ]);
      return paginate(data.map((r) => ({ ...r, role: 'reviewer' })), total, params);
    }

    if (role === 'mahasiswa') {
      const mahasiswaSearch = search
        ? {
            OR: [
              { nama: { contains: search, mode: 'insensitive' as const } },
              { email: { contains: search, mode: 'insensitive' as const } },
              { nim: { contains: search } },
            ],
          }
        : {};
      const where = { ...mahasiswaSearch };
      const [data, total] = await Promise.all([
        this.prisma.mahasiswa.findMany({
          where,
          orderBy: { nama: 'asc' },
          skip,
          take: params.limit,
          select: { id: true, userId: true, nama: true, nim: true, email: true, createdAt: true },
        }),
        this.prisma.mahasiswa.count({ where }),
      ]);
      return paginate(data.map((m) => ({ ...m, role: 'mahasiswa' })), total, params);
    }

    // Default: return both (no pagination, grouped)
    const mahasiswaSearch = search
      ? {
          OR: [
            { nama: { contains: search, mode: 'insensitive' as const } },
            { email: { contains: search, mode: 'insensitive' as const } },
            { nim: { contains: search } },
          ],
        }
      : {};
    const [mahasiswaList, reviewerList] = await Promise.all([
      this.prisma.mahasiswa.findMany({
        where: { ...mahasiswaSearch },
        orderBy: { nama: 'asc' },
        skip,
        take: params.limit,
        select: { id: true, userId: true, nama: true, nim: true, email: true, createdAt: true },
      }),
      this.prisma.reviewerUser.findMany({
        where: { ...searchFilter },
        orderBy: { nama: 'asc' },
        select: { id: true, userId: true, nama: true, email: true, nidn: true, createdAt: true },
      }),
    ]);

    return {
      mahasiswa: mahasiswaList.map((m) => ({ ...m, role: 'mahasiswa' })),
      reviewers: reviewerList.map((r) => ({ ...r, role: 'reviewer' })),
    };
  }

  async deactivate(userId: string) {
    const supabaseAdmin = this.supabaseService.getAdminClient();
    const { error } = await supabaseAdmin.auth.admin.updateUserById(userId, {
      ban_duration: '876000h', // ~100 years
    });
    if (error) {
      throw new NotFoundException('User tidak ditemukan di auth system');
    }
    return { message: 'User berhasil dinonaktifkan' };
  }

  async activate(userId: string) {
    const supabaseAdmin = this.supabaseService.getAdminClient();
    const { error } = await supabaseAdmin.auth.admin.updateUserById(userId, {
      ban_duration: 'none',
    });
    if (error) {
      throw new NotFoundException('User tidak ditemukan di auth system');
    }
    return { message: 'User berhasil diaktifkan' };
  }

  async remove(userId: string) {
    const supabaseAdmin = this.supabaseService.getAdminClient();

    // Delete from Prisma first (SET NULL on foreign keys via cascade)
    const mahasiswa = await this.prisma.mahasiswa.findUnique({ where: { userId } });
    const reviewer = await this.prisma.reviewerUser.findUnique({ where: { userId } });

    if (mahasiswa) {
      await this.prisma.mahasiswa.delete({ where: { userId } });
    }
    if (reviewer) {
      await this.prisma.reviewerUser.delete({ where: { userId } });
    }

    if (!mahasiswa && !reviewer) {
      throw new NotFoundException('User tidak ditemukan');
    }

    // Delete from Supabase auth
    await supabaseAdmin.auth.admin.deleteUser(userId);

    return { message: 'User berhasil dihapus' };
  }
}
