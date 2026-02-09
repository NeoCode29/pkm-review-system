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
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
