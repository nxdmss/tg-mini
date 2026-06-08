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
    });

    const priceById = new Map(products.map((p) => [p.id, p.price]));
    for (const item of dto.items) {
      if (!priceById.has(item.productId)) {
        throw new BadRequestException(`Product ${item.productId} not found`);
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
            price: priceById.get(item.productId)!,
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
