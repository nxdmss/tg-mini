import { Injectable, UnauthorizedException } from '@nestjs/common';
import { createHmac, timingSafeEqual } from 'crypto';
import { Role } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { TelegramRequestUser } from './telegram-user';

type RawTelegramUser = {
  id: number;
  first_name?: string;
  last_name?: string;
  username?: string;
};

@Injectable()
export class TelegramAuthService {
  constructor(private prisma: PrismaService) {}

  async getRequestUser(req: { headers?: Record<string, string | string[] | undefined> }) {
    const initData = this.getInitData(req);

    if (!initData && process.env.TELEGRAM_AUTH_DISABLED === 'true') {
      return null;
    }
    if (!initData) {
      throw new UnauthorizedException('Telegram initData is required');
    }

    const rawUser = this.validateInitData(initData);
    const telegramId = String(rawUser.id);
    const adminIds = this.adminTelegramIds();
    const dbUser = await this.prisma.user.findUnique({ where: { telegramId } });
    const role = adminIds.has(telegramId) ? Role.ADMIN : (dbUser?.role ?? Role.USER);

    return {
      telegramId,
      firstName: rawUser.first_name,
      lastName: rawUser.last_name,
      username: rawUser.username,
      role,
    } satisfies TelegramRequestUser;
  }

isAdmin(user: TelegramRequestUser | null) {
  if (!user) return false;

  const adminIds = new Set(
    (process.env.ADMIN_TELEGRAM_IDS ?? '')
      .split(',')
      .map((id) => id.trim())
      .filter(Boolean),
  );

  return adminIds.has(user.telegramId);
}

  private getInitData(req: { headers?: Record<string, string | string[] | undefined> }) {
    const value =
      req.headers?.['x-telegram-init-data'] ??
      req.headers?.['X-Telegram-Init-Data'];
    return Array.isArray(value) ? value[0] : value;
  }

  private validateInitData(initData: string): RawTelegramUser {
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    if (!botToken) {
      throw new UnauthorizedException('TELEGRAM_BOT_TOKEN is not configured');
    }

    const params = new URLSearchParams(initData);
    const hash = params.get('hash');
    const userJson = params.get('user');
    const authDate = Number(params.get('auth_date'));

    if (!hash || !userJson || !authDate) {
      throw new UnauthorizedException('Invalid Telegram initData');
    }

    const maxAgeSeconds = Number(process.env.TELEGRAM_AUTH_MAX_AGE_SECONDS ?? 86400);
    if (Date.now() / 1000 - authDate > maxAgeSeconds) {
      throw new UnauthorizedException('Telegram initData expired');
    }

    params.delete('hash');
    const dataCheckString = [...params.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, value]) => `${key}=${value}`)
      .join('\n');

    const secret = createHmac('sha256', 'WebAppData').update(botToken).digest();
    const calculated = createHmac('sha256', secret).update(dataCheckString).digest('hex');

    const hashBuffer = Buffer.from(hash, 'hex');
    const calculatedBuffer = Buffer.from(calculated, 'hex');
    if (
      hashBuffer.length !== calculatedBuffer.length ||
      !timingSafeEqual(hashBuffer, calculatedBuffer)
    ) {
      throw new UnauthorizedException('Telegram initData hash mismatch');
    }

    return JSON.parse(userJson) as RawTelegramUser;
  }

  private adminTelegramIds() {
    return new Set(
      (process.env.ADMIN_TELEGRAM_IDS ?? '')
        .split(',')
        .map((id) => id.trim())
        .filter(Boolean),
    );
  }
}
