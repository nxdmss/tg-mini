import { Body, Controller, Get, Param, Post, Query, UseInterceptors, UploadedFiles } from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { ProductsService } from './products.service';
import { CreateProductDto } from './create-product.dto';
import { QueryProductsDto } from './query-products.dto';
// Явно импортируем Multer, чтобы TypeScript не ругался на Express.Multer.File
import { Multer } from 'multer'; 

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
  @UseInterceptors(FilesInterceptor('images', 10)) 
  create(
    @Body() body: CreateProductDto,
    @UploadedFiles() images: any[], // Заменили на any[], чтобы на Render всё железно собралось без конфликтов типов
  ) {
    return this.productsService.create(body, images);
  }
}