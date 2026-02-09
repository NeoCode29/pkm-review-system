import { IsArray, IsBoolean, IsOptional, IsString, ValidateNested } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class ChecklistItemDto {
  @ApiProperty({ example: '1', description: 'Kriteria Administrasi ID' })
  @IsString()
  kriteriaAdministrasiId: string;

  @ApiProperty({ example: true, description: 'Ada kesalahan?' })
  @IsBoolean()
  adaKesalahan: boolean;
}

export class SubmitPenilaianAdministrasiDto {
  @ApiProperty({ type: [ChecklistItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ChecklistItemDto)
  checklist: ChecklistItemDto[];

  @ApiPropertyOptional({ example: 'Catatan reviewer' })
  @IsOptional()
  @IsString()
  catatan?: string;
}
