import { Module } from '@nestjs/common';
import { DosenPembimbingController } from './dosen-pembimbing.controller';
import { DosenPembimbingService } from './dosen-pembimbing.service';

@Module({
  controllers: [DosenPembimbingController],
  providers: [DosenPembimbingService],
  exports: [DosenPembimbingService],
})
export class DosenPembimbingModule {}
