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
import { UpdateProductStockDto } from './update-product-stock.dto';
import { TelegramAuthGuard } from '../auth/telegram-auth.guard';
import { AdminGuard } from '../auth/admin.guard';
import { PrismaService } from '../prisma/prisma.service';

@Controller('products')
export class ProductsController {
  constructor(
    private readonly productsService: ProductsService,
    private readonly prisma: PrismaService,
  ) {}

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

  @Patch(':id/stock')
  @UseGuards(TelegramAuthGuard, AdminGuard)
  async updateStock(
    @Param('id') id: string,
    @Body() body: UpdateProductStockDto,
  ) {
    await this.productsService.findOne(id);

    await this.prisma.$transaction(async (tx) => {
      for (const item of body.sizes) {
        await tx.productSize.updateMany({
          where: {
            productId: id,
            size: item.size.trim(),
          },
          data: {
            stock: item.stock,
          },
        });
      }

      const availableSizes = await tx.productSize.count({
        where: {
          productId: id,
          stock: {
            gt: 0,
          },
        },
      });

      await tx.product.update({
        where: {
          id,
        },
        data: {
          inStock: body.inStock && availableSizes > 0,
        },
      });
    });

    return this.productsService.findOne(id);
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
