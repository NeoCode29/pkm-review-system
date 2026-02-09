import { IsNotEmpty, IsString, IsArray, ArrayMinSize, ArrayMaxSize } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AssignReviewersDto {
  @ApiProperty({ example: '1', description: 'Proposal ID' })
  @IsNotEmpty()
  @IsString()
  proposalId: string;

  @ApiProperty({ example: ['1', '2'], description: 'Exactly 2 reviewer IDs' })
  @IsArray()
  @ArrayMinSize(2)
  @ArrayMaxSize(2)
  @IsString({ each: true })
  reviewerIds: string[];
}

export class BulkAssignDto {
  @ApiProperty({ type: [AssignReviewersDto] })
  @IsArray()
  @ArrayMinSize(1)
  assignments: AssignReviewersDto[];
}
