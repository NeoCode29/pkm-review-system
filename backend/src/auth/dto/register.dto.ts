import { IsString, IsNotEmpty, IsEmail, MinLength, MaxLength, Matches, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class RegisterMahasiswaDto {
  @ApiProperty({ example: 'mahasiswa@example.com' })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ example: 'SecurePassword123!' })
  @IsString()
  @MinLength(8)
  @MaxLength(72)
  password: string;

  @ApiProperty({ example: 'John Doe' })
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(255)
  nama: string;

  @ApiProperty({ example: '123456789012', description: 'NIM 12 digits' })
  @IsString()
  @Matches(/^\d{12}$/, { message: 'NIM must be exactly 12 digits' })
  nim: string;

  @ApiPropertyOptional({ example: '081234567890' })
  @IsOptional()
  @IsString()
  noHp?: string;

  @ApiProperty({ example: '1', description: 'Jurusan ID' })
  @IsString()
  @IsNotEmpty()
  jurusanId: string;

  @ApiProperty({ example: '1', description: 'Program Studi ID' })
  @IsString()
  @IsNotEmpty()
  programStudiId: string;
}
