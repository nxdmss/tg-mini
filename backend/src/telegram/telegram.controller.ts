import { Body, Controller, Post } from '@nestjs/common';
import { TelegramBotService } from './telegram.service';
import type { TelegramUpdate } from './telegram.service';

@Controller('telegram')
export class TelegramController {
  constructor(private readonly telegramBot: TelegramBotService) {}

  @Post('webhook')
  async webhook(@Body() update: TelegramUpdate) {
    await this.telegramBot.handleUpdate(update);
    return { ok: true };
  }
}
