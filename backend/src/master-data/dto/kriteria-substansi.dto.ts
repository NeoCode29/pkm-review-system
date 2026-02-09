import { IsNotEmpty, IsString, IsOptional, IsInt, Min, Max, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';

export class CreateKriteriaSubstansiDto {
  @ApiProperty({ example: '1', description: 'Jenis PKM ID' })
  @IsNotEmpty()
  @IsString()
  jenisPkmId: string;

  @ApiProperty({ example: 'Kualitas Penulisan' })
  @IsNotEmpty()
  @IsString()
  @MaxLength(255)
  nama: string;

  @ApiPropertyOptional({ example: 'Penilaian kualitas penulisan proposal' })
  @IsOptional()
  @IsString()
  deskripsi?: string;

  @ApiProperty({ example: 1, description: 'Minimum score' })
  @IsOptional()
  @IsInt()
  @Min(0)
  skorMin?: number;

  @ApiProperty({ example: 7, description: 'Maximum score' })
  @IsNotEmpty()
  @IsInt()
  @Min(1)
  skorMax: number;

  @ApiProperty({ example: 20, description: 'Weight percentage' })
  @IsNotEmpty()
  @IsInt()
  @Min(1)
  @Max(100)
  bobot: number;

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @IsInt()
  @Min(0)
  urutan?: number;
}

export class UpdateKriteriaSubstansiDto extends PartialType(CreateKriteriaSubstansiDto) {}

export class KriteriaSubstansiResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  jenisPkmId: string;

  @ApiProperty()
  nama: string;

  @ApiProperty({ nullable: true })
  deskripsi: string | null;

  @ApiProperty()
  skorMin: number;

  @ApiProperty()
  skorMax: number;

  @ApiProperty()
  bobot: number;

  @ApiProperty({ nullable: true })
  urutan: number | null;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
