import { Body, Controller, Delete, Get, Param, Post, UseGuards } from '@nestjs/common';
import { CatalogService } from './catalog.service';
import { CreateCatalogItemDto } from './create-catalog-item.dto';
import { TelegramAuthGuard } from '../auth/telegram-auth.guard';
import { AdminGuard } from '../auth/admin.guard';

@Controller()
export class CatalogController {
  constructor(private readonly catalogService: CatalogService) {}

  @Get('brands')
  brands() {
    return this.catalogService.brands();
  }

  @Post('brands')
  @UseGuards(TelegramAuthGuard, AdminGuard)
  createBrand(@Body() body: CreateCatalogItemDto) {
    return this.catalogService.createBrand(body.name);
  }

  @Delete('brands/:id')
  @UseGuards(TelegramAuthGuard, AdminGuard)
  deleteBrand(@Param('id') id: string) {
    return this.catalogService.deleteBrand(id);
  }

  @Get('categories')
  categories() {
    return this.catalogService.categories();
  }

  @Post('categories')
  @UseGuards(TelegramAuthGuard, AdminGuard)
  createCategory(@Body() body: CreateCatalogItemDto) {
    return this.catalogService.createCategory(body.name);
  }

  @Delete('categories/:id')
  @UseGuards(TelegramAuthGuard, AdminGuard)
  deleteCategory(@Param('id') id: string) {
    return this.catalogService.deleteCategory(id);
  }
}
