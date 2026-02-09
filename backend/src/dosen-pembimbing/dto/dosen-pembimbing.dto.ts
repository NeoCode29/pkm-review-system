import { IsNotEmpty, IsString, IsOptional, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';

export class CreateDosenPembimbingDto {
  @ApiProperty({ example: 'Dr. Budi Santoso' })
  @IsNotEmpty()
  @IsString()
  @MaxLength(255)
  nama: string;

  @ApiPropertyOptional({ example: '001122334455' })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  nidn?: string;

  @ApiPropertyOptional({ example: 'budi@university.ac.id' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  email?: string;

  @ApiPropertyOptional({ example: '081234567890' })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  noHp?: string;
}

export class UpdateDosenPembimbingDto extends PartialType(CreateDosenPembimbingDto) {}
