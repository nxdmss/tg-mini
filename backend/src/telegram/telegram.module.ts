import { Module } from '@nestjs/common';
import { TelegramController } from './telegram.controller';
import { TelegramBotService } from './telegram.service';

@Module({
  controllers: [TelegramController],
  providers: [TelegramBotService],
})
export class TelegramModule {}
