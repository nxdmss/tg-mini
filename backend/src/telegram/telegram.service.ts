import { Injectable, Logger } from '@nestjs/common';

export type TelegramUpdate = {
  message?: {
    text?: string;
    chat?: {
      id?: number | string;
    };
  };
};

@Injectable()
export class TelegramBotService {
  private readonly logger = new Logger(TelegramBotService.name);

  async handleUpdate(update: TelegramUpdate) {
    const text = update.message?.text?.trim();
    const chatId = update.message?.chat?.id;

    if (text !== '/start' || !chatId) {
      return;
    }

    await this.sendWelcome(chatId);
  }

  private async sendWelcome(chatId: number | string) {
    const frontendUrl = (process.env.FRONTEND_URL || 'https://tgmini-blue.vercel.app').replace(
      /\/$/,
      '',
    );

    await this.sendMessage(chatId, {
      text:
        'Добро пожаловать в SWA6Y5TAN.\n\n' +
        'Нажмите кнопку ниже, чтобы открыть магазин.',
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: 'Открыть магазин',
              web_app: {
                url: frontendUrl,
              },
            },
          ],
        ],
      },
    });
  }

  private async sendMessage(chatId: number | string, payload: Record<string, unknown>) {
    const botToken = process.env.TELEGRAM_BOT_TOKEN;

    if (!botToken) {
      this.logger.warn('TELEGRAM_BOT_TOKEN is not configured');
      return;
    }

    const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        ...payload,
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      this.logger.error(`Telegram sendMessage failed: ${response.status} ${text}`);
    }
  }
}
