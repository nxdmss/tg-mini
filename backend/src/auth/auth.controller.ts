import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { TelegramAuthGuard } from './telegram-auth.guard';

@Controller('auth')
export class AuthController {
  @Get('me')
  @UseGuards(TelegramAuthGuard)
  me(@Req() req: any) {
  return req.user ?? { role: 'USER' };
}
}
