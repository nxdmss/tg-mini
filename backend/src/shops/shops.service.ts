import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ShopsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    const shops = await this.prisma.shop.findMany({
      where: {
        isActive: true,
        deletedAt: null,
      },
      orderBy: {
        name: 'asc',
      },
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        logoUrl: true,
        bannerUrl: true,
        backgroundColor: true,
        textColor: true,
        accentColor: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            products: {
              where: {
                deletedAt: null,
              },
            },
          },
        },
      },
    });

    return shops.map(({ _count, ...shop }) => ({
      ...shop,
      productCount: _count.products,
    }));
  }

  async findOne(slug: string) {
    const normalizedSlug = slug.trim().toLowerCase();

    const shop = await this.prisma.shop.findFirst({
      where: {
        slug: normalizedSlug,
        isActive: true,
        deletedAt: null,
      },
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        logoUrl: true,
        bannerUrl: true,
        backgroundColor: true,
        textColor: true,
        accentColor: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            products: {
              where: {
                deletedAt: null,
              },
            },
          },
        },
      },
    });

    if (!shop) {
      throw new NotFoundException(`Shop ${normalizedSlug} not found`);
    }

    const { _count, ...shopData } = shop;

    return {
      ...shopData,
      productCount: _count.products,
    };
  }
}
