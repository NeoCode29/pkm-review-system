import { IsNotEmpty, IsBoolean } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateToggleDto {
  @ApiProperty({ example: true })
  @IsNotEmpty()
  @IsBoolean()
  enabled: boolean;
}
