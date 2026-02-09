import { IsNotEmpty, IsString, IsInt, IsObject, IsEnum, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreatePdfAnnotationDto {
  @ApiProperty({ example: '1', description: 'Proposal File ID' })
  @IsNotEmpty()
  @IsString()
  proposalFileId: string;

  @ApiProperty({ example: '1', description: 'Reviewer Assignment ID' })
  @IsNotEmpty()
  @IsString()
  reviewerAssignmentId: string;

  @ApiProperty({ enum: ['highlight', 'comment'] })
  @IsNotEmpty()
  @IsString()
  type: string;

  @ApiProperty({ example: 1, description: 'Page number' })
  @IsInt()
  @Min(1)
  pageNumber: number;

  @ApiProperty({
    example: { coordinates: { x: 100, y: 200, width: 150, height: 20 }, text: 'Highlighted', color: '#FFFF00' },
    description: 'Annotation data (JSONB)',
  })
  @IsObject()
  annotationData: Record<string, any>;
}
