import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SupabaseService } from '../auth/supabase.service';

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly supabaseService: SupabaseService,
  ) {}

  async findAll() {
    const [mahasiswaList, reviewerList] = await Promise.all([
      this.prisma.mahasiswa.findMany({
        orderBy: { nama: 'asc' },
        select: { id: true, userId: true, nama: true, nim: true, email: true, createdAt: true },
      }),
      this.prisma.reviewerUser.findMany({
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
