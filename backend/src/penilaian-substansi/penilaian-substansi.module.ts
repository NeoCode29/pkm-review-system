import { Module } from '@nestjs/common';
import { PenilaianSubstansiController } from './penilaian-substansi.controller';
import { PenilaianSubstansiService } from './penilaian-substansi.service';

@Module({
  controllers: [PenilaianSubstansiController],
  providers: [PenilaianSubstansiService],
  exports: [PenilaianSubstansiService],
})
export class PenilaianSubstansiModule {}
