import { Module } from '@nestjs/common';
import { JurusanController } from './jurusan.controller';
import { JurusanService } from './jurusan.service';
import { ProgramStudiController } from './program-studi.controller';
import { ProgramStudiService } from './program-studi.service';
import { JenisPkmController } from './jenis-pkm.controller';
import { JenisPkmService } from './jenis-pkm.service';
import { KriteriaAdministrasiController } from './kriteria-administrasi.controller';
import { KriteriaAdministrasiService } from './kriteria-administrasi.service';
import { KriteriaSubstansiController } from './kriteria-substansi.controller';
import { KriteriaSubstansiService } from './kriteria-substansi.service';

@Module({
  controllers: [
    JurusanController,
    ProgramStudiController,
    JenisPkmController,
    KriteriaAdministrasiController,
    KriteriaSubstansiController,
  ],
  providers: [
    JurusanService,
    ProgramStudiService,
    JenisPkmService,
    KriteriaAdministrasiService,
    KriteriaSubstansiService,
  ],
  exports: [
    JurusanService,
    ProgramStudiService,
    JenisPkmService,
    KriteriaAdministrasiService,
    KriteriaSubstansiService,
  ],
})
export class MasterDataModule {}
