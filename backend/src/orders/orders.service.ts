import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { OrderStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateOrderDto } from './create-order.dto';
import { TelegramRequestUser } from '../auth/telegram-user';
import { NotificationsService } from '../notifications/notifications.service';

const orderInclude = {
  items: { include: { product: { include: { images: true } } } },
  user: true,
} satisfies Prisma.OrderInclude;

type OrderWithItems = Prisma.OrderGetPayload<{ include: typeof orderInclude }>;

@Injectable()
export class OrdersService {
  private readonly logger = new Logger(OrdersService.name);

  constructor(
    private prisma: PrismaService,
    private notifications: NotificationsService,
  ) {}

  async create(dto: CreateOrderDto, requestUser: TelegramRequestUser | null) {
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

    const telegramId = requestUser?.telegramId ?? 'web-guest';
    const fallbackName = [requestUser?.firstName, requestUser?.lastName]
      .filter(Boolean)
      .join(' ');
    const displayName = dto.name ?? (fallbackName || requestUser?.username);

    const user = await this.prisma.user.upsert({
      where: { telegramId },
      update: {
        name: displayName || undefined,
        phone: dto.phone ?? undefined,
      },
      create: {
        telegramId,
        name: displayName,
        phone: dto.phone,
      },
    });

    const order = await this.prisma.order.create({
      data: {
        userId: user.id,
        customerName: dto.name,
        phone: dto.phone,
        deliveryMethod: dto.deliveryMethod,
        address: dto.address,
        comment: dto.comment,
        items: {
          create: dto.items.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
            size: item.size,
            price: productById.get(item.productId)!.price,
          })),
        },
      },
      include: orderInclude,
    });

    await this.notifyOrderCreated(order, requestUser);

    return order;
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

  async findAllForAdmin() {
    return this.prisma.order.findMany({
      orderBy: { createdAt: 'desc' },
      include: orderInclude,
    });
  }

  async updateStatus(id: string, status: OrderStatus) {
    return this.prisma.order.update({
      where: { id },
      data: { status },
      include: orderInclude,
    });
  }

  private async notifyOrderCreated(order: OrderWithItems, requestUser: TelegramRequestUser | null) {
    const notification = {
      id: order.id,
      telegramId: requestUser?.telegramId ?? order.user.telegramId,
      username: requestUser?.username,
      customerName: order.customerName,
      phone: order.phone,
      deliveryMethod: order.deliveryMethod,
      address: order.address,
      comment: order.comment,
      total: order.items.reduce((sum, item) => sum + item.price * item.quantity, 0),
      items: order.items.map((item) => ({
        name: item.product.name,
        size: item.size,
        quantity: item.quantity,
        price: item.price,
      })),
    };

    try {
      await this.notifications.sendOrderCreated(notification);
    } catch (error) {
      this.logger.error('Failed to send admin order notification', error);
    }

    try {
      await this.notifications.sendCustomerOrderAccepted(notification);
    } catch (error) {
      this.logger.error('Failed to send customer order notification', error);
    }
  }
}
