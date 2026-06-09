import { Body, Controller, Get, Param, Post, Query, UseInterceptors, UploadedFiles } from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { ProductsService } from './products.service';
import { CreateProductDto } from './create-product.dto';
import { QueryProductsDto } from './query-products.dto';

@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get()
  findAll(@Query() query: QueryProductsDto) {
    return this.productsService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.prismaService.findOne(id); // (у вас тут было this.productsService.findOne)
    return this.productsService.findOne(id);
  }

  @Post()
  // 1. Говорим NestJS ловить массив файлов из поля 'images' (максимум 10 штук)
  @UseInterceptors(FilesInterceptor('images', 10)) 
  create(
    @Body() body: CreateProductDto,
    // 2. Забираем эти файлы в переменную
    @UploadedFiles() images: Express.Multer.File[], 
  ) {
    // 3. Передаем и текстовые данные, и сами файлы в Сервис
    return this.productsService.create(body, images);
  }
}