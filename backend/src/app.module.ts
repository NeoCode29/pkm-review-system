import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { MasterDataModule } from './master-data/master-data.module';
import { MahasiswaModule } from './mahasiswa/mahasiswa.module';
import { TeamsModule } from './teams/teams.module';
import { DosenPembimbingModule } from './dosen-pembimbing/dosen-pembimbing.module';
import { ProposalsModule } from './proposals/proposals.module';
import { ReviewersModule } from './reviewers/reviewers.module';
import { AssignmentsModule } from './reviewer-assignments/assignments.module';
import { PenilaianAdministrasiModule } from './penilaian-administrasi/penilaian-administrasi.module';
import { PenilaianSubstansiModule } from './penilaian-substansi/penilaian-substansi.module';
import { PdfAnnotationsModule } from './pdf-annotations/pdf-annotations.module';
import { SystemConfigModule } from './system-config/system-config.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { UsersModule } from './users/users.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    PrismaModule,
    AuthModule,
    MasterDataModule,
    MahasiswaModule,
    TeamsModule,
    DosenPembimbingModule,
    ProposalsModule,
    ReviewersModule,
    AssignmentsModule,
    PenilaianAdministrasiModule,
    PenilaianSubstansiModule,
    PdfAnnotationsModule,
    SystemConfigModule,
    DashboardModule,
    UsersModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
