import { Body, Controller, Get, Post, UseGuards, BadRequestException, Header } from '@nestjs/common';
import { TelegramAdminGuard } from '../auth/telegram-admin.guard';
import { VisitorsService } from './visitors.service';

@Controller('visitors')
export class VisitorsController {
  constructor(private readonly visitors: VisitorsService) {}

  @Post('ping')
  @Header('Cache-Control', 'no-store')
  async ping(@Body() body: { visitorId?: unknown; path?: unknown }) {
    const id = body?.visitorId;
    if (typeof id !== 'string' || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
      throw new BadRequestException('Invalid visitor ID');
    }
    const path = typeof body.path === 'string' && body.path.startsWith('/')
      ? body.path.slice(0, 240).split('?')[0].split('#')[0]
      : '/';
    await this.visitors.ping(id, path);
    return { ok: true };
  }

  @Get('admin')
  @UseGuards(TelegramAdminGuard)
  @Header('Cache-Control', 'private, no-store')
  dashboard() {
    return this.visitors.dashboard();
  }
}
