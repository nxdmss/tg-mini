import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateOrderDto } from './create-order.dto';

@Injectable()
export class OrdersService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateOrderDto) {
    const productIds = dto.items.map((i) => i.productId);
    const products = await this.prisma.product.findMany({
      where: { id: { in: productIds } },
      include: { sizes: true },
    });

    const productById = new Map(products.map((p) => [p.id, p]));
    for (const item of dto.items) {
      const product = productById.get(item.productId);
      if (!product) {
        throw new BadRequestException(`Product ${item.productId} not found`);
      }
      if (!product.inStock) {
        throw new BadRequestException(`Product ${product.name} is out of stock`);
      }
      if (!product.sizes.some((s) => s.size === item.size)) {
        throw new BadRequestException(`Size ${item.size} is not available for ${product.name}`);
      }
    }

    const user = await this.prisma.user.upsert({
      where: { telegramId: dto.telegramId },
      update: {
        name: dto.name ?? undefined,
        phone: dto.phone ?? undefined,
      },
      create: {
        telegramId: dto.telegramId,
        name: dto.name,
        phone: dto.phone,
      },
    });

    return this.prisma.order.create({
      data: {
        userId: user.id,
        items: {
          create: dto.items.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
            size: item.size,
            price: productById.get(item.productId)!.price,
          })),
        },
      },
      include: {
        items: { include: { product: { include: { images: true } } } },
        user: true,
      },
    });
  }

  async findByTelegramId(telegramId: string) {
    return this.prisma.order.findMany({
      where: { user: { telegramId } },
      orderBy: { createdAt: 'desc' },
      include: {
        items: { include: { product: { include: { images: true } } } },
      },
    });
  }
}
