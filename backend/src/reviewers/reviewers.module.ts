import { Module } from '@nestjs/common';
import { ReviewersController } from './reviewers.controller';
import { ReviewersService } from './reviewers.service';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [ReviewersController],
  providers: [ReviewersService],
  exports: [ReviewersService],
})
export class ReviewersModule {}
