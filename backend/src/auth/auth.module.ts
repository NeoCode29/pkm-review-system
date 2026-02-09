import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { SupabaseStrategy } from './strategies/supabase.strategy';
import { SupabaseService } from './supabase.service';

@Module({
  imports: [PassportModule.register({ defaultStrategy: 'supabase' })],
  controllers: [AuthController],
  providers: [AuthService, SupabaseStrategy, SupabaseService],
  exports: [AuthService, SupabaseService, PassportModule],
})
export class AuthModule {}
