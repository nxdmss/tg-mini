import { Controller, Get, Header, Param, UseGuards } from '@nestjs/common';
import { TelegramAdminGuard } from '../auth/telegram-admin.guard';
import { ShopsService } from './shops.service';
const PUBLIC_REVALIDATE = 'public, max-age=0, must-revalidate';

@Controller('shops')
export class ShopsController {
  constructor(private readonly shopsService: ShopsService) {}
  @Get()
  @Header('Cache-Control', PUBLIC_REVALIDATE)
  findAll() { return this.shopsService.findAll(); }
  @Get('admin/all')
  @Header('Cache-Control', 'no-store')
  @UseGuards(TelegramAdminGuard)
  findAllAdmin() { return this.shopsService.findAll(); }
  @Get(':slug')
  @Header('Cache-Control', PUBLIC_REVALIDATE)
  findOne(@Param('slug') slug: string) { return this.shopsService.findOne(slug); }
}
