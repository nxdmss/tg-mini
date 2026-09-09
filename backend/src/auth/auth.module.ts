import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';

import { AuthController } from './auth.controller';
import { TelegramAdminGuard } from './telegram-admin.guard';
import { TelegramAuthGuard } from './telegram-auth.guard';
import { TelegramAuthService } from './telegram-auth.service';
import { WebAuthService } from './web-auth.service';

@Module({
  imports: [
    ConfigModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret:
          configService.get<string>('JWT_SECRET') ||
          'local-development-secret-change-me',
        signOptions: {
          expiresIn: '30d',
        },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [
    TelegramAuthService,
    WebAuthService,
    TelegramAuthGuard,
    TelegramAdminGuard,
  ],
  exports: [
    TelegramAuthService,
    WebAuthService,
    TelegramAuthGuard,
    TelegramAdminGuard,
    JwtModule,
  ],
})
export class AuthModule {}
