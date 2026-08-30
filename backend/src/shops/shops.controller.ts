import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { AdminGuard } from '../auth/admin.guard';
import { TelegramAuthGuard } from '../auth/telegram-auth.guard';
import { CreateShopDto } from './create-shop.dto';
import { ShopsService } from './shops.service';
import { UpdateShopDto } from './update-shop.dto';

@Controller('shops')
export class ShopsController {
  constructor(private readonly shopsService: ShopsService) {}

  @Get()
  findAll() {
    return this.shopsService.findAll();
  }

  @Get('admin/all')
  @UseGuards(TelegramAuthGuard, AdminGuard)
  findAllAdmin() {
    return this.shopsService.findAllAdmin();
  }

  @Get(':slug')
  findOne(@Param('slug') slug: string) {
    return this.shopsService.findOne(slug);
  }

  @Post()
  @UseGuards(TelegramAuthGuard, AdminGuard)
  create(@Body() body: CreateShopDto) {
    return this.shopsService.create(body);
  }

  @Patch(':id')
  @UseGuards(TelegramAuthGuard, AdminGuard)
  update(
    @Param('id') id: string,
    @Body() body: UpdateShopDto,
  ) {
    return this.shopsService.update(id, body);
  }
}
