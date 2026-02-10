import { IsNotEmpty, IsString, IsOptional, IsBoolean, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';

export class CreateTeamDto {
  @ApiProperty({ example: 'Tim Antigravity' })
  @IsNotEmpty()
  @IsString()
  @MaxLength(255)
  namaTeam: string;

  @ApiProperty({ example: 'Pengembangan Sistem Review PKM' })
  @IsNotEmpty()
  @IsString()
  judulProposal: string;

  @ApiProperty({ example: '1', description: 'Jenis PKM ID' })
  @IsNotEmpty()
  @IsString()
  jenisPkmId: string;

  @ApiPropertyOptional({ example: '1', description: 'Dosen Pembimbing ID' })
  @IsOptional()
  @IsString()
  dosenPembimbingId?: string;

  @ApiPropertyOptional({ example: true, description: 'Whether team is open for join requests' })
  @IsOptional()
  @IsBoolean()
  openToJoin?: boolean;
}

export class UpdateTeamDto extends PartialType(CreateTeamDto) {
  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  openToJoin?: boolean;
}

export class AddMemberDto {
  @ApiProperty({ example: '1', description: 'Mahasiswa ID to add' })
  @IsNotEmpty()
  @IsString()
  mahasiswaId: string;

  @ApiPropertyOptional({ example: 'ketua', enum: ['ketua', 'anggota'] })
  @IsOptional()
  @IsString()
  role?: string;
}

export class UpdateMemberRoleDto {
  @ApiProperty({ example: 'ketua', enum: ['ketua', 'anggota'] })
  @IsNotEmpty()
  @IsString()
  role: string;
}

export class CreateJoinRequestDto {
  @ApiPropertyOptional({ example: 'Saya ingin bergabung dengan tim ini' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  message?: string;
}
