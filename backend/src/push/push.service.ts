import {
  BadRequestException,
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';

import {
  Role,
} from '@prisma/client';

import * as webPush from 'web-push';

import { PrismaService } from '../prisma/prisma.service';
import { PushSubscriptionDto } from './push.dto';

@Injectable()
export class PushService {
  private readonly logger =
    new Logger(
      PushService.name,
    );

  private readonly publicKey =
    (
      process.env.VAPID_PUBLIC_KEY ??
      ''
    ).trim();

  private readonly privateKey =
    (
      process.env.VAPID_PRIVATE_KEY ??
      ''
    ).trim();

  private readonly subject =
    (
      process.env.VAPID_SUBJECT ??
      'https://swagystan.ru'
    ).trim();

  private readonly configured =
    Boolean(
      this.publicKey &&
      this.privateKey,
    );

  constructor(
    private readonly prisma:
      PrismaService,
  ) {
    if (
      this.configured
    ) {
      webPush.setVapidDetails(
        this.subject,
        this.publicKey,
        this.privateKey,
      );
    } else {
      this.logger.warn(
        'Web Push is not configured: VAPID keys are missing',
      );
    }
  }

  getPublicKey() {
    this.assertConfigured();

    return this.publicKey;
  }

  async subscribe(
    userId: string,
    dto:
      PushSubscriptionDto,
  ) {
    this.assertConfigured();

    const endpoint =
      dto.endpoint?.trim();

    const p256dh =
      dto.keys?.p256dh?.trim();

    const auth =
      dto.keys?.auth?.trim();

    if (
      !endpoint ||
      !p256dh ||
      !auth
    ) {
      throw new BadRequestException(
        'Некорректная push-подписка',
      );
    }

    await this.prisma
      .pushSubscription
      .upsert({
        where: {
          endpoint,
        },

        update: {
          p256dh,
          auth,
          userId,
        },

        create: {
          endpoint,
          p256dh,
          auth,
          userId,
        },
      });

    return {
      ok: true as const,
    };
  }

  async unsubscribe(
    userId: string,
    endpoint: string,
  ) {
    await this.prisma
      .pushSubscription
      .deleteMany({
        where: {
          userId,
          endpoint:
            endpoint.trim(),
        },
      });

    return {
      ok: true as const,
    };
  }

  async sendOrderCreated(
    input: {
      id: string;
      total: number;
    },
  ) {
    if (
      !this.configured
    ) {
      return;
    }

    const order =
      await this.prisma.order
        .findUnique({
          where: {
            id:
              input.id,
          },

          select: {
            id: true,
            number: true,
            customerName:
              true,
          },
        });

    if (!order) {
      return;
    }

    const subscriptions =
      await this.prisma
        .pushSubscription
        .findMany({
          where: {
            user: {
              role: {
                in: [
                  Role.ADMIN,
                  Role.MANAGER,
                ],
              },
            },
          },
        });

    if (
      subscriptions.length ===
      0
    ) {
      return;
    }

    const bodyParts = [
      this.formatPrice(
        input.total,
      ),
    ];

    if (
      order.customerName
    ) {
      bodyParts.push(
        order.customerName,
      );
    }

    const payload =
      JSON.stringify({
        title:
          `Новый заказ SW_${order.number}`,

        body:
          bodyParts.join(
            ' · ',
          ),

        tag:
          `order-${order.id}`,

        url:
          `/?order=${encodeURIComponent(
            order.id,
          )}`,
      });

    await Promise.all(
      subscriptions.map(
        async (
          subscription,
        ) => {
          try {
            await webPush
              .sendNotification(
                {
                  endpoint:
                    subscription.endpoint,

                  keys: {
                    p256dh:
                      subscription.p256dh,

                    auth:
                      subscription.auth,
                  },
                },

                payload,

                {
                  TTL: 60 * 60,
                  urgency:
                    'high',
                },
              );
          } catch (error) {
            const statusCode =
              (
                error as {
                  statusCode?:
                    number;
                }
              ).statusCode;

            if (
              statusCode ===
                404 ||
              statusCode ===
                410
            ) {
              await this.prisma
                .pushSubscription
                .deleteMany({
                  where: {
                    id:
                      subscription.id,
                  },
                });

              return;
            }

            this.logger.warn(
              `Push failed for subscription ${subscription.id}: ${
                error instanceof
                Error
                  ? error.message
                  : String(
                      error,
                    )
              }`,
            );
          }
        },
      ),
    );
  }

  private assertConfigured() {
    if (
      !this.configured
    ) {
      throw new ServiceUnavailableException(
        'Push-уведомления ещё не настроены на сервере',
      );
    }
  }

  private formatPrice(
    value: number,
  ) {
    return (
      new Intl.NumberFormat(
        'ru-RU',
      ).format(value) +
      ' ₽'
    );
  }
}
