import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';

import { TelegramAdminGuard } from '../auth/telegram-admin.guard';
import {
  PushSubscriptionDto,
  PushUnsubscribeDto,
} from './push.dto';
import { PushService } from './push.service';

@Controller('push')
@UseGuards(
  TelegramAdminGuard,
)
export class PushController {
  constructor(
    private readonly push:
      PushService,
  ) {}

  @Get('public-key')
  publicKey() {
    return {
      publicKey:
        this.push
          .getPublicKey(),
    };
  }

  @Post('subscribe')
  subscribe(
    @Req()
    req: any,

    @Body()
    body:
      PushSubscriptionDto,
  ) {
    return this.push.subscribe(
      this.userId(req),
      body,
    );
  }

  @Post('unsubscribe')
  unsubscribe(
    @Req()
    req: any,

    @Body()
    body:
      PushUnsubscribeDto,
  ) {
    return this.push.unsubscribe(
      this.userId(req),
      body.endpoint,
    );
  }

  private userId(
    req: any,
  ) {
    const userId =
      req.user?.id;

    if (
      typeof userId !==
        'string' ||
      !userId
    ) {
      throw new BadRequestException(
        'Для Web Push нужен вход через админ-аккаунт',
      );
    }

    return userId;
  }
}
