import { IsNotEmpty, IsString, MaxLength, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';

export class CreateJenisPkmDto {
  @ApiProperty({ example: 'PKM-RE' })
  @IsNotEmpty()
  @IsString()
  @MaxLength(100)
  nama: string;

  @ApiPropertyOptional({ example: 'PKM-RE' })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  kode?: string;

  @ApiPropertyOptional({ example: 'Program Kreativitas Mahasiswa - Riset Eksakta' })
  @IsOptional()
  @IsString()
  deskripsi?: string;
}

export class UpdateJenisPkmDto extends PartialType(CreateJenisPkmDto) {}

export class JenisPkmResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  nama: string;

  @ApiProperty({ nullable: true })
  kode: string | null;

  @ApiProperty({ nullable: true })
  deskripsi: string | null;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
