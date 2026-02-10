import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SupabaseService } from './supabase.service';
import { RegisterMahasiswaDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly supabaseService: SupabaseService,
  ) {}

  async registerMahasiswa(dto: RegisterMahasiswaDto) {
    // Check if NIM already exists
    const existingNim = await this.prisma.mahasiswa.findUnique({
      where: { nim: dto.nim },
    });
    if (existingNim) {
      throw new ConflictException('NIM sudah terdaftar');
    }

    // Check if email already exists
    const existingEmail = await this.prisma.mahasiswa.findUnique({
      where: { email: dto.email },
    });
    if (existingEmail) {
      throw new ConflictException('Email sudah terdaftar');
    }

    // Validate jurusan and program studi exist
    const jurusan = await this.prisma.jurusan.findUnique({
      where: { id: BigInt(dto.jurusanId) },
    });
    if (!jurusan) {
      throw new BadRequestException('Jurusan tidak ditemukan');
    }

    const programStudi = await this.prisma.programStudi.findUnique({
      where: { id: BigInt(dto.programStudiId) },
    });
    if (!programStudi) {
      throw new BadRequestException('Program Studi tidak ditemukan');
    }

    // Create user in Supabase Auth
    const supabase = this.supabaseService.getAdminClient();
    const { data: authData, error: authError } =
      await supabase.auth.admin.createUser({
        email: dto.email,
        password: dto.password,
        email_confirm: true,
        user_metadata: {
          role: 'mahasiswa',
          nama: dto.nama,
          nim: dto.nim,
        },
      });

    if (authError) {
      this.logger.error(`Supabase auth error: ${authError.message}`);
      throw new BadRequestException(
        authError.message || 'Failed to create auth user',
      );
    }

    // Create mahasiswa profile in database
    try {
      const mahasiswa = await this.prisma.mahasiswa.create({
        data: {
          userId: authData.user.id,
          nama: dto.nama,
          nim: dto.nim,
          email: dto.email,
          noHp: dto.noHp || null,
          jurusanId: BigInt(dto.jurusanId),
          programStudiId: BigInt(dto.programStudiId),
        },
      });

      this.logger.log(`Mahasiswa registered: ${mahasiswa.nim}`);

      return {
        user: {
          id: authData.user.id,
          email: authData.user.email,
        },
        mahasiswa: {
          id: mahasiswa.id.toString(),
          nama: mahasiswa.nama,
          nim: mahasiswa.nim,
        },
      };
    } catch (error) {
      // Rollback: delete Supabase user if DB creation fails
      await supabase.auth.admin.deleteUser(authData.user.id);
      this.logger.error(`Failed to create mahasiswa profile, rolled back auth user`);
      throw new BadRequestException('Failed to create user profile');
    }
  }

  async login(dto: LoginDto) {
    const supabase = this.supabaseService.getClient();
    const { data, error } = await supabase.auth.signInWithPassword({
      email: dto.email,
      password: dto.password,
    });

    if (error) {
      throw new UnauthorizedException('Email atau password salah');
    }

    // Determine user role
    const userId = data.user.id;
    let role = 'admin';
    let profile: any = null;

    const mahasiswa = await this.prisma.mahasiswa.findUnique({
      where: { userId },
    });

    if (mahasiswa) {
      role = 'mahasiswa';
      profile = {
        id: mahasiswa.id.toString(),
        nama: mahasiswa.nama,
        nim: mahasiswa.nim,
      };
    } else {
      const reviewer = await this.prisma.reviewerUser.findUnique({
        where: { userId },
      });

      if (reviewer) {
        role = 'reviewer';
        profile = {
          id: reviewer.id.toString(),
          nama: reviewer.nama,
          nidn: reviewer.nidn,
        };
      }
    }

    return {
      access_token: data.session.access_token,
      refresh_token: data.session.refresh_token,
      user: {
        id: data.user.id,
        email: data.user.email,
        role,
      },
      profile,
    };
  }

  async refreshToken(refreshToken: string) {
    const supabase = this.supabaseService.getClient();
    const { data, error } = await supabase.auth.refreshSession({ refresh_token: refreshToken });

    if (error || !data.session) {
      throw new UnauthorizedException('Refresh token tidak valid atau sudah expired');
    }

    return {
      access_token: data.session.access_token,
      refresh_token: data.session.refresh_token,
    };
  }

  async getProfile(userId: string) {
    // Try mahasiswa
    const mahasiswa = await this.prisma.mahasiswa.findUnique({
      where: { userId },
      include: {
        jurusan: true,
        programStudi: true,
      },
    });

    if (mahasiswa) {
      return {
        role: 'mahasiswa',
        profile: mahasiswa,
      };
    }

    // Try reviewer
    const reviewer = await this.prisma.reviewerUser.findUnique({
      where: { userId },
    });

    if (reviewer) {
      return {
        role: 'reviewer',
        profile: reviewer,
      };
    }

    return {
      role: 'admin',
      profile: null,
    };
  }
}
