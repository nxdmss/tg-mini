import {
  Body,
  Controller,
  Delete,
  Get,
  Header,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';

import { TelegramAdminGuard } from '../auth/telegram-admin.guard';
import { CreateShopDto } from './create-shop.dto';
import { ShopsService } from './shops.service';
import { UpdateShopDto } from './update-shop.dto';

const PUBLIC_REVALIDATE = 'public, max-age=0, must-revalidate';

@Controller('shops')
export class ShopsController {
  constructor(private readonly shopsService: ShopsService) {}

  @Get()
  @Header('Cache-Control', PUBLIC_REVALIDATE)
  findAll() {
    return this.shopsService.findAll();
  }

  @Get('admin/all')
  @Header('Cache-Control', 'no-store')
  @UseGuards(TelegramAdminGuard)
  findAllAdmin() {
    return this.shopsService.findAllAdmin();
  }

  @Get(':slug')
  @Header('Cache-Control', PUBLIC_REVALIDATE)
  findOne(@Param('slug') slug: string) {
    return this.shopsService.findOne(slug);
  }

  @Post()
  @UseGuards(TelegramAdminGuard)
  create(@Body() body: CreateShopDto) {
    return this.shopsService.create(body);
  }

  @Patch(':id')
  @UseGuards(TelegramAdminGuard)
  update(
    @Param('id') id: string,
    @Body() body: UpdateShopDto,
  ) {
    return this.shopsService.update(id, body);
  }

  @Delete(':id')
  @UseGuards(TelegramAdminGuard)
  remove(@Param('id') id: string) {
    return this.shopsService.remove(id);
  }
}
