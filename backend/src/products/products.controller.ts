import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { ProductsService } from './products.service';
import { CreateProductDto } from './create-product.dto';
import { QueryProductsDto } from './query-products.dto';
import { UpdateProductDto } from './update-product.dto';
import { TelegramAuthGuard } from '../auth/telegram-auth.guard';
import { AdminGuard } from '../auth/admin.guard';

@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get()
  findAll(@Query() query: QueryProductsDto) {
    return this.productsService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.productsService.findOne(id);
  }

  @Post()
  @UseGuards(TelegramAuthGuard, AdminGuard)
  @UseInterceptors(FilesInterceptor('images', 10)) 
  create(
    @Body() body: CreateProductDto,
    @UploadedFiles() images: any[],
  ) {
    return this.productsService.create(body, images);
  }

  @Patch(':id')
  @UseGuards(TelegramAuthGuard, AdminGuard)
  @UseInterceptors(FilesInterceptor('images', 10))
  update(
    @Param('id') id: string,
    @Body() body: UpdateProductDto,
    @UploadedFiles() images: any[],
  ) {
    return this.productsService.update(id, body, images);
  }

  @Delete(':id')
  @UseGuards(TelegramAuthGuard, AdminGuard)
  remove(@Param('id') id: string) {
    return this.productsService.remove(id);
  }
}