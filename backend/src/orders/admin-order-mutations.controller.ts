import {
  BadRequestException,
  Controller,
  Delete,
  NotFoundException,
  Param,
  UseGuards,
} from '@nestjs/common';

import {
  Prisma,
} from '@prisma/client';

import { TelegramAdminGuard } from '../auth/telegram-admin.guard';
import { PrismaService } from '../prisma/prisma.service';

const orderInclude = {
  items: {
    include: {
      product: {
        include: {
          images: {
            orderBy: {
              sortOrder:
                'asc',
            },
          },
        },
      },
    },
  },

  user: {
    select: {
      id: true,
      telegramId: true,
      email: true,
      name: true,
      phone: true,
      role: true,
      createdAt: true,
    },
  },
} satisfies Prisma.OrderInclude;

@Controller('orders/admin')
@UseGuards(TelegramAdminGuard)
export class AdminOrderMutationsController {
  constructor(
    private readonly prisma:
      PrismaService,
  ) {}

  @Delete(':id/items/:itemId')
  async removeItem(
    @Param('id')
    orderId: string,

    @Param('itemId')
    itemId: string,
  ) {
    return this.prisma.$transaction(
      async (tx) => {
        const order =
          await tx.order.findUnique({
            where: {
              id:
                orderId,
            },

            select: {
              id: true,

              items: {
                select: {
                  id: true,
                },
              },
            },
          });

        if (!order) {
          throw new NotFoundException(
            'Заказ не найден',
          );
        }

        if (
          order.items.length <=
          1
        ) {
          throw new BadRequestException(
            'Последний товар удалить нельзя. Удалите заказ целиком.',
          );
        }

        const item =
          await tx.orderItem.findFirst({
            where: {
              id:
                itemId,

              orderId,
            },
          });

        if (!item) {
          throw new NotFoundException(
            'Товар в заказе не найден',
          );
        }

        // Order history changes never alter manually managed size availability.

        await tx.orderItem.delete({
          where: {
            id:
              item.id,
          },
        });

        return tx.order.findUniqueOrThrow({
          where: {
            id:
              orderId,
          },

          include:
            orderInclude,
        });
      },
    );
  }

  @Delete(':id')
  async removeOrder(
    @Param('id')
    orderId: string,
  ) {
    return this.prisma.$transaction(
      async (tx) => {
        const order =
          await tx.order.findUnique({
            where: {
              id:
                orderId,
            },

            include: {
              items:
                true,
            },
          });

        if (!order) {
          throw new NotFoundException(
            'Заказ не найден',
          );
        }

        await tx.order.delete({
          where: {
            id:
              orderId,
          },
        });

        return {
          ok: true,
          id:
            orderId,
        };
      },
    );
  }
}
