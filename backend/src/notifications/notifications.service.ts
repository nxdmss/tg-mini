import {
  Injectable,
  Logger,
} from '@nestjs/common';

type OrderNotificationItem = {
  name: string;
  size: string;
  quantity: number;
  price: number;
};

type OrderNotification = {
  id: string;

  telegramId?: string | null;
  username?: string | null;

  customerName?: string | null;

  email?: string | null;

  phone?: string | null;

  deliveryMethod?: string | null;

  address?: string | null;

  comment?: string | null;

  total: number;

  items: OrderNotificationItem[];
};

@Injectable()
export class NotificationsService {
  private readonly logger =
    new Logger(
      NotificationsService.name,
    );

  async sendOrderCreated(
    order: OrderNotification,
  ) {
    const botToken =
      process.env.TELEGRAM_BOT_TOKEN;

    const chatId =
      process.env.ORDER_NOTIFY_CHAT_ID ||
      process.env.ADMIN_TELEGRAM_CHAT_ID;

    if (
      !botToken ||
      !chatId
    ) {
      this.logger.warn(
        'Telegram order notifications are not configured',
      );

      return;
    }

    const response =
      await fetch(
        `https://api.telegram.org/bot${botToken}/sendMessage`,
        {
          method:
            'POST',

          headers: {
            'Content-Type':
              'application/json',
          },

          body:
            JSON.stringify({
              chat_id:
                chatId,

              text:
                this.formatOrder(
                  order,
                ),

              parse_mode:
                'HTML',

              disable_web_page_preview:
                true,
            }),
        },
      );

    if (!response.ok) {
      const text =
        await response.text();

      throw new Error(
        `Telegram notification failed: ${response.status} ${text}`,
      );
    }
  }

  async sendCustomerOrderAccepted(
    order: OrderNotification,
  ) {
    const botToken =
      process.env.TELEGRAM_BOT_TOKEN;

    if (
      !botToken ||
      !order.telegramId
    ) {
      return;
    }

    const response =
      await fetch(
        `https://api.telegram.org/bot${botToken}/sendMessage`,
        {
          method:
            'POST',

          headers: {
            'Content-Type':
              'application/json',
          },

          body:
            JSON.stringify({
              chat_id:
                order.telegramId,

              text:
                `Заказ SWA6Y5TAN принят.\n\n` +
                `Номер: ${this.shortOrderNumber(order.id)}\n` +
                `Сумма: ${this.formatPrice(order.total)}\n\n` +
                'С вами скоро свяжутся для подтверждения заказа.',
            }),
        },
      );

    if (!response.ok) {
      const text =
        await response.text();

      throw new Error(
        `Telegram customer notification failed: ${response.status} ${text}`,
      );
    }
  }

  private formatOrder(
    order: OrderNotification,
  ) {
    const items =
      order.items
        .map(
          (
            item,
            index,
          ) =>
            `${index + 1}. ${this.escapeHtml(item.name)} | размер ${this.escapeHtml(item.size)} | ${item.quantity} шт. | ${this.formatPrice(
              item.price *
                item.quantity,
            )}`,
        )
        .join('\n');

    return [
      '<b>Новый заказ SWA6Y5TAN</b>',

      `Номер: <b>${this.shortOrderNumber(order.id)}</b>`,

      '',

      '<b>Товары:</b>',

      items,

      '',

      `<b>Итого:</b> ${this.formatPrice(order.total)}`,

      '',

      `<b>Имя:</b> ${this.escapeHtml(
        order.customerName ||
          'не указано',
      )}`,

      `<b>Email:</b> ${this.escapeHtml(
        order.email ||
          'не указан',
      )}`,

      `<b>Телефон:</b> ${this.escapeHtml(
        order.phone ||
          'не указан',
      )}`,

      `<b>Получение:</b> ${this.escapeHtml(
        order.deliveryMethod ||
          'не указано',
      )}`,

      `<b>Адрес:</b> ${this.escapeHtml(
        order.address ||
          'не указан',
      )}`,

      `<b>Комментарий:</b> ${this.escapeHtml(
        order.comment ||
          'нет',
      )}`,
    ].join('\n');
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

  private shortOrderNumber(
    id: string,
  ) {
    let hash = 0;

    for (
      let i = 0;
      i < id.length;
      i += 1
    ) {
      hash =
        (
          hash * 31 +
          id.charCodeAt(i)
        ) %
        100000;
    }

    return String(
      hash,
    ).padStart(
      5,
      '0',
    );
  }

  private escapeHtml(
    value: string,
  ) {
    return value
      .replace(
        /&/g,
        '&amp;',
      )
      .replace(
        /</g,
        '&lt;',
      )
      .replace(
        />/g,
        '&gt;',
      );
  }
}
