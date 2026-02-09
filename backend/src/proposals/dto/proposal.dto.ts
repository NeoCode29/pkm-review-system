import { IsNotEmpty, IsString, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class SubmitProposalDto {
  @ApiPropertyOptional({ example: 'submitted' })
  @IsOptional()
  @IsString()
  status?: string;
}

export class UploadProposalFileDto {
  @ApiProperty({ description: 'PDF file', type: 'string', format: 'binary' })
  file: any;
}
