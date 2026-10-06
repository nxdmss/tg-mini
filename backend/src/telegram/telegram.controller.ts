import {
  Body,
  Controller,
  Headers,
  Post,
  UnauthorizedException,
} from '@nestjs/common';
import {
  timingSafeEqual,
} from 'node:crypto';

import { TelegramBotService } from './telegram.service';
import type { TelegramUpdate } from './telegram.service';

function secretsEqual(
  provided: string,
  expected: string,
) {
  const left =
    Buffer.from(provided);
  const right =
    Buffer.from(expected);

  return (
    left.length ===
      right.length &&
    timingSafeEqual(
      left,
      right,
    )
  );
}

@Controller('telegram')
export class TelegramController {
  constructor(private readonly telegramBot: TelegramBotService) {}

  @Post('webhook')
  async webhook(
    @Body()
    update: TelegramUpdate,
    @Headers(
      'x-telegram-bot-api-secret-token',
    )
    providedSecret?: string,
  ) {
    const expectedSecret =
      process.env
        .TELEGRAM_WEBHOOK_SECRET
        ?.trim();

    if (
      expectedSecret &&
      (!providedSecret ||
        !secretsEqual(
          providedSecret,
          expectedSecret,
        ))
    ) {
      throw new UnauthorizedException();
    }

    await this.telegramBot.handleUpdate(update);
    return { ok: true };
  }
}
