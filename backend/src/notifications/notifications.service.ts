import { Injectable } from '@nestjs/common';

type OrderForNotification = {
  id: string;
  customerName?: string | null;
  phone?: string | null;
  deliveryMethod?: string | null;
  address?: string | null;
  comment?: string | null;
  items: {
    quantity: number;
    size: string;
    price: number;
    product: { name: string };
  }[];
  user: { telegramId: string; name?: string | null };
};

@Injectable()
export class NotificationsService {
  async orderCreated(order: OrderForNotification) {
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.ORDER_NOTIFY_CHAT_ID ?? process.env.ADMIN_TELEGRAM_CHAT_ID;
    if (!botToken || !chatId) return;

    const total = order.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const lines = order.items
      .map((item) => `• ${item.product.name}, ${item.size} × ${item.quantity}`)
      .join('\n');
    const delivery =
      order.deliveryMethod === 'courier'
        ? `Курьер: ${order.address || 'адрес не указан'}`
        : 'Самовывоз';

    const text = [
      `Новый заказ #${order.id.slice(-6)}`,
      `Клиент: ${order.customerName || order.user.name || 'Без имени'}`,
      `Telegram ID: ${order.user.telegramId}`,
      `Телефон: ${order.phone || 'не указан'}`,
      delivery,
      order.comment ? `Комментарий: ${order.comment}` : null,
      '',
      lines,
      '',
      `Итого: ${total} ₽`,
    ]
      .filter(Boolean)
      .join('\n');

    await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text }),
    });
  }
}
