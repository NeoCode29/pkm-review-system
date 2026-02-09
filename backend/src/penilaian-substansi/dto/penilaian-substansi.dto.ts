import { IsArray, IsString, IsOptional, IsNumber, ValidateNested } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class SkorItemDto {
  @ApiProperty({ example: '1', description: 'Kriteria Substansi ID' })
  @IsString()
  kriteriaSubstansiId: string;

  @ApiProperty({ example: 6, description: 'Score (1-7, skip 4)' })
  @IsNumber()
  skor: number;
}

export class SubmitPenilaianSubstansiDto {
  @ApiProperty({ type: [SkorItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SkorItemDto)
  scores: SkorItemDto[];

  @ApiPropertyOptional({ example: 'Catatan reviewer' })
  @IsOptional()
  @IsString()
  catatan?: string;
}
