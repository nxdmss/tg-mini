import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AdminGuard } from './admin.guard';
import { TelegramAuthGuard } from './telegram-auth.guard';
import { TelegramAuthService } from './telegram-auth.service';

@Module({
  controllers: [AuthController],
  providers: [TelegramAuthService, TelegramAuthGuard, AdminGuard],
  exports: [TelegramAuthService, TelegramAuthGuard, AdminGuard],
})
export class AuthModule {}
