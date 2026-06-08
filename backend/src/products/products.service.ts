import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProductDto } from './create-product.dto';
import { QueryProductsDto } from './query-products.dto';

const productInclude = {
  images: true,
  sizes: true,
  brand: true,
  category: true,
} satisfies Prisma.ProductInclude;

@Injectable()
export class ProductsService {
  constructor(private prisma: PrismaService) {}

  async findAll(query: QueryProductsDto = {}) {
    const where: Prisma.ProductWhereInput = {};

    if (query.category) {
      where.category = { name: { equals: query.category, mode: 'insensitive' } };
    }
    if (query.brand) {
      where.brand = { name: { equals: query.brand, mode: 'insensitive' } };
    }
    if (query.search) {
      where.OR = [
        { name: { contains: query.search, mode: 'insensitive' } },
        { description: { contains: query.search, mode: 'insensitive' } },
      ];
    }
    if (query.inStock !== undefined) {
      where.inStock = query.inStock;
    }

    let orderBy: Prisma.ProductOrderByWithRelationInput = { createdAt: 'desc' };
    if (query.sort === 'price_asc') orderBy = { price: 'asc' };
    else if (query.sort === 'price_desc') orderBy = { price: 'desc' };

    return this.prisma.product.findMany({ where, orderBy, include: productInclude });
  }

  async findOne(id: string) {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: productInclude,
    });
    if (!product) {
      throw new NotFoundException(`Product ${id} not found`);
    }
    return product;
  }

  async create(data: CreateProductDto) {
    return this.prisma.product.create({
      data: {
        name: data.name,
        price: data.price,
        description: data.description,
        brand: { connect: { id: data.brandId } },
        category: { connect: { id: data.categoryId } },
        images: {
          create: (data.images || []).map((url: string) => ({ url })),
        },
        sizes: {
          create: (data.sizes || []).map((size: string) => ({ size })),
        },
      },
      include: productInclude,
    });
  }
}
