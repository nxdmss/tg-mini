# ZOV Buyer Launch Checklist

Use this checklist before sharing the shop with buyers.

## 1. Rotate Exposed Secrets

The old credentials were shared in chat, so replace them before production.

- BotFather: revoke the old bot token and create a new one.
- Cloudinary: create a new API secret or rotate the API key pair.
- Render PostgreSQL: rotate the database password or create fresh credentials.

Never commit `.env` files.

## 2. Backend Environment

Add these variables in Render backend service settings:

```env
DATABASE_URL=postgresql://...
BACKEND_URL=https://tg-mini-backend.onrender.com
CORS_ORIGINS=https://YOUR_FRONTEND_DOMAIN
TELEGRAM_BOT_TOKEN=NEW_BOT_TOKEN
ADMIN_TELEGRAM_IDS=1593426947
TELEGRAM_AUTH_DISABLED=false
TELEGRAM_AUTH_MAX_AGE_SECONDS=86400
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
CLOUDINARY_FOLDER=zov/products
ORDER_NOTIFY_CHAT_ID=1593426947
```

`ORDER_NOTIFY_CHAT_ID` can be your personal Telegram ID if the bot has received `/start` from you.

## 3. Frontend Environment

Add this variable in the frontend hosting settings:

```env
VITE_API_URL=https://tg-mini-backend.onrender.com
```

## 4. Telegram Mini App Setup

In `@BotFather`:

1. Open your bot.
2. Set the bot menu button / web app URL to the deployed frontend URL.
3. Add a short bot description: `ZOV - магазин одежды в Telegram. Выберите товар, оставьте заявку, мы подтвердим оплату и доставку.`
4. Open the Mini App from Telegram, not only from a browser, to verify `initData`.

## 5. Catalog Readiness

Before launch:

- Delete demo products or edit them in `/admin`.
- Every visible product must have at least one size.
- Every visible product must have a real Cloudinary image.
- Prices must be final buyer-facing prices.
- Hide unavailable products by setting `inStock=false`.

## 6. Smoke Test

Run locally or in CI:

```sh
cd backend && npm run build
cd ../frontend && npm run lint
cd ../frontend && npm run build
```

Check public endpoints:

```sh
curl https://tg-mini-backend.onrender.com/
curl https://tg-mini-backend.onrender.com/products
curl https://tg-mini-backend.onrender.com/categories
```

Buyer flow inside Telegram:

1. Open the Mini App.
2. Search/filter products.
3. Open a product.
4. Choose size.
5. Add to cart.
6. Enter name, phone, delivery method and address.
7. Submit order.
8. Confirm the admin receives a Telegram notification.

## 7. Buyer Reply Templates

Order confirmation:

```text
Привет! Получили вашу заявку ZOV: [товары]. Сумма: [сумма]. Подтверждаете заказ?
```

Payment:

```text
После подтверждения пришлем реквизиты для оплаты. Товар резервируем на 30 минут.
```

Delivery:

```text
Доставка: [условия/стоимость]. После оплаты отправим трек или время встречи.
```

Unavailable item:

```text
К сожалению, этот размер уже закончился. Можем предложить: [варианты].
```
