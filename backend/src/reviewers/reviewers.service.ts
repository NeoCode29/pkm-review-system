import {
  Injectable,
  NotFoundException,
  ConflictException,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SupabaseService } from '../auth/supabase.service';
import { CreateReviewerDto, UpdateReviewerDto } from './dto/reviewer.dto';

@Injectable()
export class ReviewersService {
  private readonly logger = new Logger(ReviewersService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly supabaseService: SupabaseService,
  ) {}

  // One-step creation: Supabase auth user + ReviewerUser profile in transaction
  async create(dto: CreateReviewerDto, adminUserId: string) {
    // Check email uniqueness
    const existing = await this.prisma.reviewerUser.findFirst({
      where: { email: dto.email },
    });
    if (existing) {
      throw new ConflictException(`Email "${dto.email}" sudah terdaftar sebagai reviewer`);
    }

    // Create Supabase auth user
    const supabaseAdmin = this.supabaseService.getAdminClient();
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: dto.email,
      password: dto.password,
      email_confirm: true,
      user_metadata: { role: 'reviewer', nama: dto.nama },
    });

    if (authError || !authData.user) {
      this.logger.error('Failed to create Supabase auth user for reviewer', authError);
      throw new InternalServerErrorException('Gagal membuat akun reviewer');
    }

    try {
      // Create ReviewerUser profile
      return await this.prisma.reviewerUser.create({
        data: {
          userId: authData.user.id,
          nama: dto.nama,
          email: dto.email,
          nidn: dto.nidn,
          noHp: dto.noHp,
          programStudiId: dto.programStudiId ? BigInt(dto.programStudiId) : undefined,
          createdBy: adminUserId,
        },
      });
    } catch (error) {
      // Rollback: delete Supabase auth user
      this.logger.error('Failed to create reviewer profile, rolling back auth user');
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
      throw new InternalServerErrorException('Gagal membuat profil reviewer');
    }
  }

  async findAll() {
    return this.prisma.reviewerUser.findMany({
      orderBy: { nama: 'asc' },
      include: {
        _count: { select: { reviewerAssignments: true } },
      },
    });
  }

  async findOne(id: bigint) {
    const reviewer = await this.prisma.reviewerUser.findUnique({
      where: { id },
      include: {
        programStudi: { select: { id: true, nama: true, jurusan: { select: { id: true, nama: true } } } },
        reviewerAssignments: {
          include: {
            proposal: {
              select: { id: true, type: true, status: true, team: { select: { id: true, namaTeam: true } } },
            },
            penilaianAdministrasi: { select: { isComplete: true } },
            penilaianSubstansi: { select: { isComplete: true } },
          },
        },
      },
    });
    if (!reviewer) {
      throw new NotFoundException('Reviewer tidak ditemukan');
    }

    // Calculate stats
    const stats = {
      totalAssigned: reviewer.reviewerAssignments.length,
      completed: reviewer.reviewerAssignments.filter(
        (a) => a.penilaianAdministrasi?.isComplete && a.penilaianSubstansi?.isComplete,
      ).length,
      pending: reviewer.reviewerAssignments.filter(
        (a) => !a.penilaianAdministrasi?.isComplete || !a.penilaianSubstansi?.isComplete,
      ).length,
    };

    return { ...reviewer, stats };
  }

  async update(id: bigint, dto: UpdateReviewerDto, adminUserId: string) {
    await this.findOne(id);

    const data: any = { updatedBy: adminUserId };
    if (dto.nama) data.nama = dto.nama;
    if (dto.nidn !== undefined) data.nidn = dto.nidn;
    if (dto.noHp !== undefined) data.noHp = dto.noHp;
    if (dto.email) data.email = dto.email;
    if (dto.programStudiId !== undefined) data.programStudiId = dto.programStudiId ? BigInt(dto.programStudiId) : null;

    return this.prisma.reviewerUser.update({ where: { id }, data });
  }

  async remove(id: bigint) {
    const reviewer = await this.findOne(id);

    // Delete Supabase auth user
    const supabaseAdmin = this.supabaseService.getAdminClient();
    await supabaseAdmin.auth.admin.deleteUser(reviewer.userId);

    // Delete reviewer profile (assignments will SET NULL via cascade)
    return this.prisma.reviewerUser.delete({ where: { id } });
  }
}
