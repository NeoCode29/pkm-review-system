import { Module } from '@nestjs/common';
import { PenilaianAdministrasiController } from './penilaian-administrasi.controller';
import { PenilaianAdministrasiService } from './penilaian-administrasi.service';

@Module({
  controllers: [PenilaianAdministrasiController],
  providers: [PenilaianAdministrasiService],
  exports: [PenilaianAdministrasiService],
})
export class PenilaianAdministrasiModule {}
