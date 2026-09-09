import {
  Body,
  Controller,
  Delete,
  Get,
  Header,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';

import { TelegramAdminGuard } from '../auth/telegram-admin.guard';
import { CatalogService } from './catalog.service';
import { CreateCatalogItemDto } from './create-catalog-item.dto';

const PUBLIC_REVALIDATE = 'public, max-age=0, must-revalidate';

@Controller()
export class CatalogController {
  constructor(private readonly catalogService: CatalogService) {}

  @Get('brands')
  @Header('Cache-Control', PUBLIC_REVALIDATE)
  brands() {
    return this.catalogService.brands();
  }

  @Post('brands')
  @UseGuards(TelegramAdminGuard)
  createBrand(@Body() body: CreateCatalogItemDto) {
    return this.catalogService.createBrand(body.name);
  }

  @Delete('brands/:id')
  @UseGuards(TelegramAdminGuard)
  deleteBrand(@Param('id') id: string) {
    return this.catalogService.deleteBrand(id);
  }

  @Get('categories')
  @Header('Cache-Control', PUBLIC_REVALIDATE)
  categories() {
    return this.catalogService.categories();
  }

  @Post('categories')
  @UseGuards(TelegramAdminGuard)
  createCategory(@Body() body: CreateCatalogItemDto) {
    return this.catalogService.createCategory(body.name);
  }

  @Delete('categories/:id')
  @UseGuards(TelegramAdminGuard)
  deleteCategory(@Param('id') id: string) {
    return this.catalogService.deleteCategory(id);
  }
}
