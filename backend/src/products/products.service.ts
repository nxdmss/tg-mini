import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ProductsService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.product.findMany({
      include: {
        images: true,
        sizes: true,
        brand: true,
        category: true,
      },
    });
  }

  async findOne(id: string) {
    return this.prisma.product.findUnique({
      where: { id },
      include: {
        images: true,
        sizes: true,
        brand: true,
        category: true,
      },
    });
  }

  async create(data: any) {
    return this.prisma.product.create({
      data: {
        name: data.name,
        price: data.price,
        description: data.description,

        brand: {
          connect: { id: data.brandId },
        },

        category: {
          connect: { id: data.categoryId },
        },

        images: {
          create: (data.images || []).map((url: string) => ({
            url,
          })),
        },

        sizes: {
          create: (data.sizes || []).map((size: string) => ({
            size,
          })),
        },
      },
      include: {
        images: true,
        sizes: true,
      },
    });
  }
}