import {
  Body,
  BadRequestException,
  UnauthorizedException,
  Patch,
  Controller,
  Get,
  Header,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { TelegramAdminGuard } from './telegram-admin.guard';
import { TelegramAuthGuard } from './telegram-auth.guard';
import { WebAuthService } from './web-auth.service';

@Controller('auth')
export class AuthController {
  constructor(private readonly webAuthService: WebAuthService, private readonly prisma: PrismaService) {}

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

  @Patch('me')
  @UseGuards(TelegramAuthGuard)
  async updateName(@Req() req: any, @Body() body: any) {
    if (!req.user?.id) throw new UnauthorizedException();
    const name = typeof body?.name === 'string' ? body.name.trim().replace(/\s+/g, ' ') : '';
    if (!name || name.length > 80) throw new BadRequestException('Имя: от 1 до 80 символов');
    return this.prisma.user.update({ where: { id: req.user.id }, data: { name },
      select: { id: true, name: true, email: true, phone: true, role: true, telegramId: true } });
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
