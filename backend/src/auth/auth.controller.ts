import {
  Body,
  Controller,
  Get,
  Header,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';

import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { TelegramAdminGuard } from './telegram-admin.guard';
import { TelegramAuthGuard } from './telegram-auth.guard';
import { WebAuthService } from './web-auth.service';

@Controller('auth')
export class AuthController {
  constructor(private readonly webAuthService: WebAuthService) {}

  @Post('register')
  register(@Body() dto: RegisterDto) {
    return this.webAuthService.register(dto);
  }

  @Post('login')
  login(@Body() dto: LoginDto) {
    return this.webAuthService.login(dto);
  }

  @Get('me')
  @Header('Cache-Control', 'no-store')
  @UseGuards(TelegramAuthGuard)
  me(@Req() req: any) {
    return req.user ?? { role: 'USER' };
  }

  @Get('admin-check')
  @Header('Cache-Control', 'no-store')
  @UseGuards(TelegramAdminGuard)
  adminCheck(@Req() req: any) {
    return {
      ok: true,
      telegramId: req.user?.telegramId,
    };
  }
}
