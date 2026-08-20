import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';

import { TelegramAuthService } from './telegram-auth.service';

import { WebAuthService } from './web-auth.service';

@Injectable()
export class TelegramAuthGuard
  implements CanActivate
{
  constructor(
    private readonly telegramAuth: TelegramAuthService,
    private readonly webAuth: WebAuthService,
  ) {}

  async canActivate(
    context: ExecutionContext,
  ) {
    const request =
      context.switchToHttp().getRequest();

    const authorization =
      request.headers?.authorization;

    if (
      typeof authorization === 'string' &&
      authorization.startsWith('Bearer ')
    ) {
      const token =
        authorization
          .slice('Bearer '.length)
          .trim();

      if (!token) {
        throw new UnauthorizedException(
          'Authorization token is missing',
        );
      }

      request.user =
        await this.webAuth.getUserFromToken(
          token,
        );

      return true;
    }

    request.user =
      await this.telegramAuth.getRequestUser(
        request,
      );

    return true;
  }
}