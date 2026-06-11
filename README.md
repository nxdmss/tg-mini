# SWA6Y5TAN Telegram Mini App

SWA6Y5TAN is a Telegram Mini App storefront for a clothing catalog. The project has a React/Vite frontend and a NestJS/Prisma backend with PostgreSQL, Telegram initData auth, admin-only product management, Cloudinary image uploads, search, categories and cart checkout.

## Structure

- `frontend/` - React 19, Vite, Telegram WebApp SDK, catalog UI and admin panel.
- `backend/` - NestJS API, Prisma schema, Telegram auth guards, products, catalog and orders.

## Local Setup

1. Install dependencies:

```sh
cd backend && npm install
cd ../frontend && npm install
```

2. Configure environment files:

```sh
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

3. Prepare the database:

```sh
cd backend
npm run prisma:push
npm run seed
```

4. Run the apps in separate terminals:

```sh
cd backend && npm run start:dev
cd frontend && npm run dev
```

## Required Environment

Backend:

- `DATABASE_URL` - PostgreSQL connection string.
- `TELEGRAM_BOT_TOKEN` - bot token used to validate Telegram `initData`.
- `ADMIN_TELEGRAM_IDS` - comma-separated Telegram user IDs allowed to use `/admin`.
- `CLOUDINARY_URL` or `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` - product image uploads.
- `BACKEND_URL` - public backend URL for legacy local image URLs.
- `CORS_ORIGINS` - allowed frontend origins.

Frontend:

- `VITE_API_URL` - public backend API URL.

## Production Notes

- Product create/update/delete routes are protected by Telegram auth and admin role.
- Orders are created from validated Telegram auth context, not from a client-provided Telegram ID.
- New product images are uploaded to Cloudinary, so they survive server restarts and Render-style ephemeral filesystems.
- New orders can be sent to Telegram via `ORDER_NOTIFY_CHAT_ID` or `ADMIN_TELEGRAM_CHAT_ID`.
- Keep `TELEGRAM_AUTH_DISABLED=false` in production.

See `LAUNCH_CHECKLIST.md` before sharing the shop with buyers.
