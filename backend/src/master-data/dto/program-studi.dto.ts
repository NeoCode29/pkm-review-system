import { IsNotEmpty, IsString, MaxLength } from 'class-validator';
import { ApiProperty, PartialType } from '@nestjs/swagger';

export class CreateProgramStudiDto {
  @ApiProperty({ example: 'Informatika' })
  @IsNotEmpty()
  @IsString()
  @MaxLength(255)
  nama: string;

  @ApiProperty({ example: '1', description: 'Jurusan ID' })
  @IsNotEmpty()
  @IsString()
  jurusanId: string;
}

export class UpdateProgramStudiDto extends PartialType(CreateProgramStudiDto) {}

export class ProgramStudiResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  nama: string;

  @ApiProperty()
  jurusanId: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
