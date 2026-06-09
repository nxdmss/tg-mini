import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProductDto } from './create-product.dto';
import { QueryProductsDto } from './query-products.dto';
import * as fs from 'fs';
import * as path from 'path';

const productInclude = {
  images: {
    orderBy: {
      url: 'asc',
    },
  },
  sizes: true,
  brand: true,
  category: true,
} satisfies Prisma.ProductInclude;

@Injectable()
export class ProductsService {
  private readonly uploadDir = path.join(process.cwd(), 'uploads');

  constructor(private prisma: PrismaService) {
    if (!fs.existsSync(this.uploadDir)) {
      fs.mkdirSync(this.uploadDir, { recursive: true });
    }
  }

  async findAll(query: QueryProductsDto = {}) {
    const where: Prisma.ProductWhereInput = {};

    if (query.category) {
      where.category = {
        name: {
          equals: query.category,
          mode: 'insensitive',
        },
      };
    }

    if (query.brand) {
      where.brand = {
        name: {
          equals: query.brand,
          mode: 'insensitive',
        },
      };
    }

    if (query.search) {
      where.OR = [
        {
          name: {
            contains: query.search,
            mode: 'insensitive',
          },
        },
        {
          description: {
            contains: query.search,
            mode: 'insensitive',
          },
        },
      ];
    }

    if (query.inStock !== undefined) {
      where.inStock = query.inStock;
    }

    let orderBy: Prisma.ProductOrderByWithRelationInput = {
      createdAt: 'desc',
    };

    if (query.sort === 'price_asc') {
      orderBy = { price: 'asc' };
    } else if (query.sort === 'price_desc') {
      orderBy = { price: 'desc' };
    }

    const products = await this.prisma.product.findMany({
      where,
      orderBy,
      include: productInclude,
    });

    const backendUrl = (
      process.env.BACKEND_URL ||
      'https://tg-mini-backend.onrender.com'
    ).replace(/\/$/, '');

    return products.map((product) => ({
      ...product,
      sizes: product.sizes || [],
      images: (product.images || []).map((img) => {
        if (img.url.startsWith('http')) {
          return img;
        }

        const cleanPath = img.url.replace(/^\/+/, '');

        return {
          ...img,
          url: `${backendUrl}/${cleanPath}`,
        };
      }),
    }));
  }

  async findOne(id: string) {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: productInclude,
    });

    if (!product) {
      throw new NotFoundException(`Product ${id} not found`);
    }

    const backendUrl = (
      process.env.BACKEND_URL ||
      'https://tg-mini-backend.onrender.com'
    ).replace(/\/$/, '');

    return {
      ...product,
      images: (product.images || []).map((img) => {
        if (img.url.startsWith('http')) {
          return img;
        }

        const cleanPath = img.url.replace(/^\/+/, '');

        return {
          ...img,
          url: `${backendUrl}/${cleanPath}`,
        };
      }),
    };
  }

  async create(data: CreateProductDto, imageFiles: any[] = []) {
    const savedImageUrls = imageFiles.map((file) => {
      const uniqueFilename = `${Date.now()}_${file.originalname}`;
      const filePath = path.join(this.uploadDir, uniqueFilename);

      fs.writeFileSync(filePath, file.buffer);

      return `uploads/${uniqueFilename}`;
    });

    return this.prisma.product.create({
      data: {
        name: data.name,
        price: data.price,
        description: data.description,
        brand: {
          connect: {
            id: data.brandId,
          },
        },
        category: {
          connect: {
            id: data.categoryId,
          },
        },
        images: {
          create: savedImageUrls.map((url) => ({
            url,
          })),
        },
        sizes: {
          create: (data.sizes || []).map((size) => ({
            size,
          })),
        },
      },
      include: productInclude,
    });
  }
}