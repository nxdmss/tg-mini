import {
  Body,
  Controller,
  Delete,
  Get,
  Header,
  Param,
  Patch,
  Post,
  Query,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';

import { TelegramAdminGuard } from '../auth/telegram-admin.guard';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProductDto } from './create-product.dto';
import { ProductsService } from './products.service';
import { QueryProductsDto } from './query-products.dto';
import { UpdateProductDto } from './update-product.dto';
import { UpdateProductShopDto } from './update-product-shop.dto';
import { UpdateProductStockDto } from './update-product-stock.dto';

const PUBLIC_REVALIDATE = 'public, max-age=0, must-revalidate';

@Controller('products')
export class ProductsController {
  constructor(
    private readonly productsService: ProductsService,
    private readonly prisma: PrismaService,
  ) {}

  @Get()
  @Header('Cache-Control', PUBLIC_REVALIDATE)
  findAll(@Query() query: QueryProductsDto) {
    return this.productsService.findAll(query);
  }

  @Get(':id')
  @Header('Cache-Control', PUBLIC_REVALIDATE)
  findOne(@Param('id') id: string) {
    return this.productsService.findOne(id);
  }

  @Post()
  @UseGuards(TelegramAdminGuard)
  @UseInterceptors(FilesInterceptor('images', 10))
  create(
    @Body() body: CreateProductDto,
    @UploadedFiles() images: any[],
  ) {
    return this.productsService.create(body, images);
  }

  @Patch(':id/stock')
  @UseGuards(TelegramAdminGuard)
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

  @Patch(':id/shop')
  @UseGuards(TelegramAdminGuard)
  moveToShop(
    @Param('id') id: string,
    @Body() body: UpdateProductShopDto,
  ) {
    return this.productsService.moveToShop(id, body.shopId);
  }

  @Patch(':id')
  @UseGuards(TelegramAdminGuard)
  @UseInterceptors(FilesInterceptor('images', 10))
  update(
    @Param('id') id: string,
    @Body() body: UpdateProductDto,
    @UploadedFiles() images: any[],
  ) {
    return this.productsService.update(id, body, images);
  }

  @Delete(':id')
  @UseGuards(TelegramAdminGuard)
  remove(@Param('id') id: string) {
    return this.productsService.remove(id);
  }
}
