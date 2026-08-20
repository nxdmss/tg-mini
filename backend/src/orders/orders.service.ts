import {
  BadRequestException,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';

import {
  OrderStatus,
  Prisma,
} from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';

import { CreateOrderDto } from './create-order.dto';

import { NotificationsService } from '../notifications/notifications.service';

const orderInclude = {
  items: {
    include: {
      product: {
        include: {
          images: true,
        },
      },
    },
  },

  user: true,
} satisfies Prisma.OrderInclude;

type OrderWithItems =
  Prisma.OrderGetPayload<{
    include: typeof orderInclude;
  }>;

type RequestUser = {
  id?: string;
  telegramId?: string | null;
};

@Injectable()
export class OrdersService {
  private readonly logger =
    new Logger(
      OrdersService.name,
    );

  constructor(
    private readonly prisma: PrismaService,

    private readonly notifications: NotificationsService,
  ) {}

  async create(
    dto: CreateOrderDto,
  ) {
    const order =
      await this.prisma.$transaction(
        async (tx) => {
          const productIds = [
            ...new Set(
              dto.items.map(
                (item) =>
                  item.productId,
              ),
            ),
          ];

          const products =
            await tx.product.findMany({
              where: {
                id: {
                  in: productIds,
                },

                deletedAt: null,
              },

              include: {
                sizes: true,
              },
            });

          const productById =
            new Map(
              products.map(
                (product) => [
                  product.id,
                  product,
                ],
              ),
            );

          const requestedByVariant =
            new Map<
              string,
              number
            >();

          for (
            const item of
            dto.items
          ) {
            if (
              !item.quantity ||
              item.quantity < 1
            ) {
              throw new BadRequestException(
                'Количество должно быть не меньше 1',
              );
            }

            const product =
              productById.get(
                item.productId,
              );

            if (!product) {
              throw new BadRequestException(
                `Товар ${item.productId} не найден`,
              );
            }

            if (
              !product.inStock
            ) {
              throw new BadRequestException(
                `${product.name} закончился`,
              );
            }

            const size =
              product.sizes.find(
                (currentSize) =>
                  currentSize.size ===
                  item.size,
              );

            if (!size) {
              throw new BadRequestException(
                `Размер ${item.size} недоступен для ${product.name}`,
              );
            }

            const key =
              `${item.productId}:${item.size}`;

            const currentQuantity =
              requestedByVariant.get(
                key,
              ) ?? 0;

            requestedByVariant.set(
              key,
              currentQuantity +
                item.quantity,
            );
          }

          for (
            const [
              key,
              quantity,
            ] of
            requestedByVariant
          ) {
            const separatorIndex =
              key.lastIndexOf(
                ':',
              );

            const productId =
              key.slice(
                0,
                separatorIndex,
              );

            const sizeName =
              key.slice(
                separatorIndex +
                  1,
              );

            const product =
              productById.get(
                productId,
              );

            if (!product) {
              throw new BadRequestException(
                'Товар не найден',
              );
            }

            const size =
              product.sizes.find(
                (currentSize) =>
                  currentSize.size ===
                  sizeName,
              );

            if (!size) {
              throw new BadRequestException(
                `Размер ${sizeName} недоступен`,
              );
            }

            if (
              size.stock <
              quantity
            ) {
              throw new BadRequestException(
                `Недостаточно товара ${product.name}, размер ${sizeName}. Осталось: ${size.stock}`,
              );
            }
          }

          for (
            const [
              key,
              quantity,
            ] of
            requestedByVariant
          ) {
            const separatorIndex =
              key.lastIndexOf(
                ':',
              );

            const productId =
              key.slice(
                0,
                separatorIndex,
              );

            const sizeName =
              key.slice(
                separatorIndex +
                  1,
              );

            const updated =
              await tx.productSize.updateMany({
                where: {
                  productId,

                  size:
                    sizeName,

                  stock: {
                    gte:
                      quantity,
                  },
                },

                data: {
                  stock: {
                    decrement:
                      quantity,
                  },
                },
              });

            if (
              updated.count !==
              1
            ) {
              const product =
                productById.get(
                  productId,
                );

              throw new BadRequestException(
                `Недостаточно товара ${
                  product?.name ??
                  productId
                }, размер ${sizeName}`,
              );
            }
          }

          const createdOrder =
            await tx.order.create({
              data: {
                customerName:
                  dto.name.trim(),

                email:
                  dto.email
                    .trim()
                    .toLowerCase(),

                phone:
                  dto.phone,

                deliveryMethod:
                  dto.deliveryMethod,

                address:
                  dto.address?.trim() ||
                  undefined,

                comment:
                  dto.comment?.trim() ||
                  undefined,

                items: {
                  create:
                    dto.items.map(
                      (item) => ({
                        productId:
                          item.productId,

                        quantity:
                          item.quantity,

                        size:
                          item.size,

                        price:
                          productById.get(
                            item.productId,
                          )!.price,
                      }),
                    ),
                },
              },

              include:
                orderInclude,
            });

          for (
            const productId of
            productIds
          ) {
            const remainingSizes =
              await tx.productSize.count({
                where: {
                  productId,

                  stock: {
                    gt: 0,
                  },
                },
              });

            await tx.product.update({
              where: {
                id:
                  productId,
              },

              data: {
                inStock:
                  remainingSizes >
                  0,
              },
            });
          }

          return createdOrder;
        },
      );

    await this.notifyOrderCreated(
      order,
    );

    return order;
  }

  async findMine(
    requestUser: RequestUser | null,
  ) {
    if (!requestUser) {
      throw new UnauthorizedException(
        'Войдите в аккаунт',
      );
    }

    if (requestUser.id) {
      return this.prisma.order.findMany({
        where: {
          userId:
            requestUser.id,
        },

        orderBy: {
          createdAt:
            'desc',
        },

        include: {
          items: {
            include: {
              product: {
                include: {
                  images: true,
                },
              },
            },
          },
        },
      });
    }

    if (
      requestUser.telegramId
    ) {
      return this.prisma.order.findMany({
        where: {
          user: {
            telegramId:
              requestUser.telegramId,
          },
        },

        orderBy: {
          createdAt:
            'desc',
        },

        include: {
          items: {
            include: {
              product: {
                include: {
                  images: true,
                },
              },
            },
          },
        },
      });
    }

    throw new UnauthorizedException(
      'Пользователь не определён',
    );
  }

  async findAllForAdmin() {
    return this.prisma.order.findMany({
      orderBy: {
        createdAt:
          'desc',
      },

      include:
        orderInclude,
    });
  }

  async updateStatus(
    id: string,
    status: OrderStatus,
  ) {
    return this.prisma.order.update({
      where: {
        id,
      },

      data: {
        status,
      },

      include:
        orderInclude,
    });
  }

  private async notifyOrderCreated(
    order: OrderWithItems,
  ) {
    const notification = {
      id:
        order.id,

      telegramId:
        order.user?.telegramId ??
        null,

      customerName:
        order.customerName,

      email:
        order.email,

      phone:
        order.phone,

      deliveryMethod:
        order.deliveryMethod,

      address:
        order.address,

      comment:
        order.comment,

      total:
        order.items.reduce(
          (
            sum,
            item,
          ) =>
            sum +
            item.price *
              item.quantity,
          0,
        ),

      items:
        order.items.map(
          (item) => ({
            name:
              item.product.name,

            size:
              item.size,

            quantity:
              item.quantity,

            price:
              item.price,
          }),
        ),
    };

    try {
      await this.notifications.sendOrderCreated(
        notification,
      );
    } catch (error) {
      this.logger.error(
        'Failed to send admin order notification',
        error,
      );
    }
  }
}