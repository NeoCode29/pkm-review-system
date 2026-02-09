import { IsNotEmpty, IsString, IsOptional, IsEmail, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';

export class CreateReviewerDto {
  @ApiProperty({ example: 'Dr. Reviewer' })
  @IsNotEmpty()
  @IsString()
  @MaxLength(255)
  nama: string;

  @ApiProperty({ example: 'reviewer@university.ac.id' })
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'password123', minLength: 6 })
  @IsNotEmpty()
  @IsString()
  password: string;

  @ApiPropertyOptional({ example: '001122334455' })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  nidn?: string;

  @ApiPropertyOptional({ example: '081234567890' })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  noHp?: string;
}

export class UpdateReviewerDto extends PartialType(CreateReviewerDto) {}
