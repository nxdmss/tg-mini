import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';

import { TelegramAuthService } from './telegram-auth.service';

@Injectable()
export class TelegramAdminGuard implements CanActivate {
  constructor(private readonly telegramAuth: TelegramAuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();

    const rawInitData = request.headers?.['x-telegram-init-data'];
    const initData = Array.isArray(rawInitData) ? rawInitData[0] : rawInitData;

    if (typeof initData !== 'string' || !initData.trim()) {
      throw new UnauthorizedException('Telegram admin authentication is required');
    }

    const ownerTelegramId = (process.env.ADMIN_TELEGRAM_IDS ?? '').trim();

    if (!/^\d+$/.test(ownerTelegramId)) {
      throw new ForbiddenException('ADMIN_TELEGRAM_IDS must contain one numeric Telegram user ID');
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
