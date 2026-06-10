import { Injectable, Logger } from '@nestjs/common';

type OrderNotificationItem = {
  name: string;
  size: string;
  quantity: number;
  price: number;
};

type OrderNotification = {
  id: string;
  customerName?: string | null;
  phone?: string | null;
  deliveryMethod?: string | null;
  address?: string | null;
  comment?: string | null;
  total: number;
  items: OrderNotificationItem[];
};

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  async sendOrderCreated(order: OrderNotification) {
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.ORDER_NOTIFY_CHAT_ID || process.env.ADMIN_TELEGRAM_CHAT_ID;

    if (!botToken || !chatId) {
      this.logger.warn('Telegram order notifications are not configured');
      return;
    }

    const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: this.formatOrder(order),
        disable_web_page_preview: true,
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Telegram notification failed: ${response.status} ${text}`);
    }
  }

  private formatOrder(order: OrderNotification) {
    const items = order.items
      .map(
        (item, index) =>
          `${index + 1}. ${item.name} | размер ${item.size} | ${item.quantity} шт. | ${this.formatPrice(
            item.price * item.quantity,
          )}`,
      )
      .join('\n');

    return [
      'Новый заказ ZOV',
      `ID: ${order.id}`,
      '',
      items,
      '',
      `Итого: ${this.formatPrice(order.total)}`,
      `Имя: ${order.customerName || 'не указано'}`,
      `Телефон: ${order.phone || 'не указан'}`,
      `Получение: ${order.deliveryMethod || 'не указано'}`,
      `Адрес: ${order.address || 'не указан'}`,
      `Комментарий: ${order.comment || 'нет'}`,
    ].join('\n');
  }

  private formatPrice(value: number) {
    return new Intl.NumberFormat('ru-RU').format(value) + ' ₽';
  }
}
