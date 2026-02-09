import { IsNotEmpty, IsString, IsOptional, IsInt, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';

export class CreateKriteriaAdministrasiDto {
  @ApiProperty({ example: '1', description: 'Jenis PKM ID' })
  @IsNotEmpty()
  @IsString()
  jenisPkmId: string;

  @ApiProperty({ example: 'Kelengkapan berkas administrasi' })
  @IsNotEmpty()
  @IsString()
  deskripsi: string;

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @IsInt()
  @Min(0)
  urutan?: number;
}

export class UpdateKriteriaAdministrasiDto extends PartialType(CreateKriteriaAdministrasiDto) {}

export class KriteriaAdministrasiResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  jenisPkmId: string;

  @ApiProperty()
  deskripsi: string;

  @ApiProperty({ nullable: true })
  urutan: number | null;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
