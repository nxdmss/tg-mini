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
      useFactory: (configService: ConfigService) => {
        const configuredSecret =
          configService
            .get<string>(
              'JWT_SECRET',
            )
            ?.trim();

        const isProduction =
          configService.get<string>(
            'NODE_ENV',
          ) === 'production';

        if (
          isProduction &&
          (!configuredSecret ||
            configuredSecret.length <
              32)
        ) {
          throw new Error(
            'JWT_SECRET must be at least 32 characters in production',
          );
        }

        return {
          secret:
            configuredSecret ||
            'local-development-secret-change-me',
          signOptions: {
            expiresIn: '12h',
          },
        };
      },
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
