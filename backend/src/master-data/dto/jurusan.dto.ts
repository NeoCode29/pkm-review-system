import { IsNotEmpty, IsString, MaxLength, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';

export class CreateJurusanDto {
  @ApiProperty({ example: 'Teknik Informatika' })
  @IsNotEmpty()
  @IsString()
  @MaxLength(255)
  nama: string;
}

export class UpdateJurusanDto extends PartialType(CreateJurusanDto) {}

export class JurusanResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  nama: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
