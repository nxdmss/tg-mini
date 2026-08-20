import { Module } from '@nestjs/common';

import { JwtModule } from '@nestjs/jwt';

import { ConfigModule, ConfigService } from '@nestjs/config';

import { AuthController } from './auth.controller';

import { AdminGuard } from './admin.guard';

import { TelegramAuthGuard } from './telegram-auth.guard';

import { TelegramAuthService } from './telegram-auth.service';

import { WebAuthService } from './web-auth.service';

@Module({
  imports: [
    ConfigModule,

    JwtModule.registerAsync({
      imports: [ConfigModule],

      inject: [ConfigService],

      useFactory: (
        configService: ConfigService,
      ) => ({
        secret:
          configService.get<string>('JWT_SECRET') ||
          'local-development-secret-change-me',

        signOptions: {
          expiresIn: '30d',
        },
      }),
    }),
  ],

  controllers: [
    AuthController,
  ],

  providers: [
    TelegramAuthService,
    WebAuthService,
    TelegramAuthGuard,
    AdminGuard,
  ],

  exports: [
    TelegramAuthService,
    WebAuthService,
    TelegramAuthGuard,
    AdminGuard,
    JwtModule,
  ],
})
export class AuthModule {}