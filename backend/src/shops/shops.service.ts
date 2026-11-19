import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
const shopSelect = {
  id: true,
  name: true,
  slug: true,
  description: true,
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
} satisfies Prisma.ShopSelect;


function mapShop<T extends { _count: { products: number } }>(
  shop: T,
) {
  const { _count, ...shopData } = shop;

  return {
    ...shopData,
    productCount: _count.products,
  };
}


@Injectable()
export class ShopsService {
  constructor(private readonly prisma: PrismaService) {}
  async findAll() {
    return (await this.prisma.shop.findMany({
      where: { slug: 'swagystan', isActive: true, deletedAt: null },
      select: shopSelect,
    })).map(mapShop);
  }
  async findOne(slug: string) {
    if (slug.trim().toLowerCase() !== 'swagystan') throw new NotFoundException('Shop not found');
    const shop = await this.prisma.shop.findFirst({
      where: { slug: 'swagystan', isActive: true, deletedAt: null },
      select: shopSelect,
    });
    if (!shop) throw new NotFoundException('SWAGYSTAN not found');
    return mapShop(shop);
  }
}
