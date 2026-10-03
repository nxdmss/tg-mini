import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';

import { TelegramAuthService } from './telegram-auth.service';
import { WebAuthService } from './web-auth.service';

@Injectable()
export class TelegramAdminGuard implements CanActivate {
  constructor(
    private readonly telegramAuth: TelegramAuthService,
    private readonly webAuth: WebAuthService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();

    const authorization = request.headers?.authorization;

    if (
      typeof authorization === 'string' &&
      authorization.startsWith('Bearer ')
    ) {
      const token = authorization.slice('Bearer '.length).trim();

      if (!token) {
        throw new UnauthorizedException('Authorization token is missing');
      }

      const user = await this.webAuth.getUserFromToken(token);

      if (user.role !== 'ADMIN' && user.role !== 'MANAGER') {
        throw new ForbiddenException('Admin access denied');
      }

      request.user = user;
      return true;
    }

    const rawInitData = request.headers?.['x-telegram-init-data'];
    const initData = Array.isArray(rawInitData) ? rawInitData[0] : rawInitData;

    if (typeof initData !== 'string' || !initData.trim()) {
      throw new UnauthorizedException('Admin authentication is required');
    }

    const ownerTelegramId = (process.env.ADMIN_TELEGRAM_IDS ?? '').trim();

    if (!/^\d+$/.test(ownerTelegramId)) {
      throw new ForbiddenException(
        'ADMIN_TELEGRAM_IDS must contain one numeric Telegram user ID',
      );
    }

    const telegramUser = await this.telegramAuth.getRequestUser(request);
    const telegramId = String(telegramUser?.telegramId ?? '').trim();

    if (telegramId !== ownerTelegramId) {
      throw new ForbiddenException('Admin access denied');
    }

    request.user = telegramUser;
    return true;
  }
}
