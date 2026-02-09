import { IsOptional, IsString, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateMahasiswaDto {
  @ApiPropertyOptional({ example: 'Updated Name' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  nama?: string;

  @ApiPropertyOptional({ example: '081234567890' })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  noHp?: string;
}

export class MahasiswaDashboardDto {
  @ApiProperty()
  hasTeam: boolean;

  @ApiProperty({ nullable: true })
  team: any;

  @ApiProperty({ nullable: true })
  proposals: any[];
}
