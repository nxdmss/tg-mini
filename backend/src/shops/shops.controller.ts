import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { AdminGuard } from '../auth/admin.guard';
import { TelegramAuthGuard } from '../auth/telegram-auth.guard';
import { CreateShopDto } from './create-shop.dto';
import { ShopsService } from './shops.service';
import { UpdateShopDto } from './update-shop.dto';

type ShopImageFiles = {
  logo?: any[];
};

const shopImageInterceptor = FileFieldsInterceptor([
  { name: 'logo', maxCount: 1 },
]);

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
  @UseInterceptors(shopImageInterceptor)
  create(
    @Body() body: CreateShopDto,
    @UploadedFiles() files: ShopImageFiles = {},
  ) {
    return this.shopsService.create(body, files);
  }

  @Patch(':id')
  @UseGuards(TelegramAuthGuard, AdminGuard)
  @UseInterceptors(shopImageInterceptor)
  update(
    @Param('id') id: string,
    @Body() body: UpdateShopDto,
    @UploadedFiles() files: ShopImageFiles = {},
  ) {
    return this.shopsService.update(id, body, files);
  }
  @Delete(':id')
  @UseGuards(TelegramAuthGuard, AdminGuard)
  remove(@Param('id') id: string) {
    return this.shopsService.remove(id);
  }

}
