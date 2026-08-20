import {
  Body,
  Controller,
  Get,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';

import { TelegramAuthGuard } from './telegram-auth.guard';

import { WebAuthService } from './web-auth.service';

import { RegisterDto } from './dto/register.dto';

import { LoginDto } from './dto/login.dto';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly webAuthService: WebAuthService,
  ) {}

  @Post('register')
  register(
    @Body() dto: RegisterDto,
  ) {
    return this.webAuthService.register(dto);
  }

  @Post('login')
  login(
    @Body() dto: LoginDto,
  ) {
    return this.webAuthService.login(dto);
  }

  @Get('me')
  @UseGuards(TelegramAuthGuard)
  me(
    @Req() req: any,
  ) {
    return req.user ?? {
      role: 'USER',
    };
  }
}