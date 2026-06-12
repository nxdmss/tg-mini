import {
  BadRequestException,
  InternalServerErrorException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { v2 as cloudinary, UploadApiResponse } from 'cloudinary';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProductDto } from './create-product.dto';
import { QueryProductsDto } from './query-products.dto';
import { UpdateProductDto } from './update-product.dto';

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
  constructor(private prisma: PrismaService) {}

  async findAll(query: QueryProductsDto = {}) {
    const where: Prisma.ProductWhereInput = {
      deletedAt: null,
    };

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

    return products.map((product) => this.normalizeProduct(product));
  }

  async findOne(id: string) {
    const product = await this.prisma.product.findFirst({
      where: { id, deletedAt: null },
      include: productInclude,
    });

    if (!product) {
      throw new NotFoundException(`Product ${id} not found`);
    }

    return this.normalizeProduct(product);
  }

  async create(data: CreateProductDto, imageFiles: any[] = []) {
    await this.ensureActiveCatalogRefs(data.brandId, data.categoryId);

    const savedImageUrls = [
      ...(data.images ?? []),
      ...(await this.uploadImages(imageFiles)),
    ];

    const product = await this.prisma.product.create({
      data: {
        name: data.name,
        price: data.price,
        description: data.description,
        inStock: data.inStock ?? true,
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

    return this.normalizeProduct(product);
  }

  async update(id: string, data: UpdateProductDto, imageFiles: any[] = []) {
    await this.ensureProductExists(id);
    await this.ensureActiveCatalogRefs(data.brandId, data.categoryId);

    const uploadedUrls = await this.uploadImages(imageFiles);
    const imageUrls =
      data.images !== undefined || uploadedUrls.length > 0
        ? [...(data.images ?? []), ...uploadedUrls]
        : undefined;

    const product = await this.prisma.product.update({
      where: { id },
      data: {
        name: data.name,
        price: data.price,
        description: data.description,
        inStock: data.inStock,
        brand: data.brandId ? { connect: { id: data.brandId } } : undefined,
        category: data.categoryId ? { connect: { id: data.categoryId } } : undefined,
        images:
          imageUrls !== undefined
            ? {
                deleteMany: {},
                create: imageUrls.map((url) => ({ url })),
              }
            : undefined,
        sizes:
          data.sizes !== undefined
            ? {
                deleteMany: {},
                create: data.sizes.map((size) => ({ size })),
              }
            : undefined,
      },
      include: productInclude,
    });

    return this.normalizeProduct(product);
  }

  async remove(id: string) {
    await this.ensureProductExists(id);
    await this.prisma.product.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        inStock: false,
      },
    });
    return { ok: true };
  }

  private async ensureProductExists(id: string) {
    const product = await this.prisma.product.findFirst({ where: { id, deletedAt: null } });
    if (!product) {
      throw new NotFoundException(`Product ${id} not found`);
    }
  }

  private async ensureActiveCatalogRefs(brandId?: string, categoryId?: string) {
    if (brandId) {
      const brand = await this.prisma.brand.findFirst({
        where: { id: brandId, deletedAt: null },
      });

      if (!brand) {
        throw new BadRequestException('Brand not found');
      }
    }

    if (categoryId) {
      const category = await this.prisma.category.findFirst({
        where: { id: categoryId, deletedAt: null },
      });

      if (!category) {
        throw new BadRequestException('Category not found');
      }
    }
  }

  private normalizeProduct(product: Prisma.ProductGetPayload<{ include: typeof productInclude }>) {
    const backendUrl = (
      process.env.BACKEND_URL ||
      'https://tg-mini-backend.onrender.com'
    ).replace(/\/$/, '');

    return {
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
    };
  }

  private async uploadImages(imageFiles: any[] = []) {
    if (imageFiles.length === 0) return [];

    this.configureCloudinary();

    return Promise.all(
      imageFiles.map((file) =>
        new Promise<string>((resolve, reject) => {
          const stream = cloudinary.uploader.upload_stream(
            {
              folder: process.env.CLOUDINARY_FOLDER || 'zov/products',
              resource_type: 'image',
            },
            (error, result?: UploadApiResponse) => {
              if (error || !result) {
                reject(
                  new InternalServerErrorException(
                    error?.message || 'Cloudinary upload failed',
                  ),
                );
                return;
              }

              resolve(result.secure_url);
            },
          );

          stream.end(file.buffer);
        }),
      ),
    );
  }

  private configureCloudinary() {
    if (process.env.CLOUDINARY_URL) return;

    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;

    if (!cloudName || !apiKey || !apiSecret) {
      const missing = [
        !cloudName ? 'CLOUDINARY_CLOUD_NAME' : null,
        !apiKey ? 'CLOUDINARY_API_KEY' : null,
        !apiSecret ? 'CLOUDINARY_API_SECRET' : null,
      ].filter(Boolean);

      throw new BadRequestException(
        `Cloudinary is not configured. Missing: ${missing.join(', ')}. Alternatively set CLOUDINARY_URL.`,
      );
    }

    cloudinary.config({
      cloud_name: cloudName,
      api_key: apiKey,
      api_secret: apiSecret,
    });
  }
}