import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';

export interface JwtPayload {
  sub: string;
  email: string;
  role?: string;
  aud?: string;
  iss?: string;
}

export interface AuthenticatedUser {
  id: string;
  email: string;
  role: string;
  mahasiswaId?: bigint;
  reviewerUserId?: bigint;
}

@Injectable()
export class SupabaseStrategy extends PassportStrategy(Strategy, 'supabase') {
  private readonly logger = new Logger(SupabaseStrategy.name);

  constructor(
    private configService: ConfigService,
    private prisma: PrismaService,
  ) {
    const jwtSecret = configService.get<string>('JWT_SECRET');
    if (!jwtSecret) {
      throw new Error('JWT_SECRET must be defined');
    }

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: jwtSecret,
    });
  }

  async validate(payload: JwtPayload): Promise<AuthenticatedUser> {
    const { sub: userId, email } = payload;

    if (!userId) {
      throw new UnauthorizedException('Invalid token: missing user ID');
    }

    // Check if user is mahasiswa
    const mahasiswa = await this.prisma.mahasiswa.findUnique({
      where: { userId },
    });

    if (mahasiswa) {
      return {
        id: userId,
        email: email || mahasiswa.email,
        role: 'mahasiswa',
        mahasiswaId: mahasiswa.id,
      };
    }

    // Check if user is reviewer
    const reviewer = await this.prisma.reviewerUser.findUnique({
      where: { userId },
    });

    if (reviewer) {
      return {
        id: userId,
        email: email || reviewer.email,
        role: 'reviewer',
        reviewerUserId: reviewer.id,
      };
    }

    // Check user metadata from Supabase for admin role
    // If no profile found, check if it's an admin (admin has no profile table)
    // For now, treat users without profiles as potential admins
    // This will be refined when we implement admin seeding
    const userRole = payload.role || 'admin';

    if (userRole === 'admin') {
      return {
        id: userId,
        email: email || '',
        role: 'admin',
      };
    }

    throw new UnauthorizedException('User profile not found');
  }
}
