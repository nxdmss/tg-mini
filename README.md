# SWA6Y5TAN

Telegram Mini App + web storefront for a multi-shop clothing marketplace.

## Stack

- Frontend: React 19, TypeScript, Vite, Motion
- Backend: NestJS, Prisma, PostgreSQL
- Images: Cloudinary
- Production frontend: Vercel
- Production backend: Render
- Auth: signed Telegram `initData`
- Admin: exactly one Telegram user ID from `ADMIN_TELEGRAM_IDS`

## Project structure

```text
frontend/   storefront, product pages, cart, checkout, admin UI
backend/    API, Telegram auth, products, shops, orders, Prisma
```

## Requirements

- Node.js 22
- PostgreSQL
- Telegram bot token
- Cloudinary account

## Install

From the project root:

```bash
npm run setup
```

Or separately:

```bash
cd backend && npm ci
cd ../frontend && npm ci
```

## Environment

Create local files from the examples:

```text
backend/.env.example  -> backend/.env
frontend/.env.example -> frontend/.env
```

Never commit `.env` files.

### Backend essentials

```text
DATABASE_URL=
TELEGRAM_BOT_TOKEN=
ADMIN_TELEGRAM_IDS=
TELEGRAM_AUTH_DISABLED=false
CORS_ORIGINS=
BACKEND_URL=
CLOUDINARY_URL=
```

`ADMIN_TELEGRAM_IDS` must contain exactly one numeric Telegram user ID.

### Frontend essentials

```text
VITE_API_URL=
VITE_BOT_USERNAME=
VITE_MINI_APP_SHORT_NAME=
```

## Build

```bash
npm run build
```

Or separately:

```bash
npm --prefix backend run build
npm --prefix frontend run build
```

## Database

Production database changes must use committed Prisma migrations:

```bash
cd backend
npx prisma migrate deploy
```

Do not use `prisma db push` or the old seed workflow against production data.

## Production

### Render backend

Root directory:

```text
backend
```

Build:

```text
npm ci && npm run build
```

Start:

```text
npm run start:prod
```

Important production settings:

```text
TELEGRAM_AUTH_DISABLED=false
ADMIN_TELEGRAM_IDS=<one numeric Telegram user id>
```

### Vercel frontend

Root directory:

```text
frontend
```

Build:

```text
npm run build
```

Output:

```text
dist
```

Set `VITE_API_URL` to the public backend URL.

## Routes

```text
/                              main SWA6Y5TAN catalog
/shop/:shopSlug                seller catalog
/product/:id                   legacy SWA6Y5TAN product route
/shop/:shopSlug/product/:id    seller product
/admin                         Telegram-owner-only admin
```

## Important implementation rules

- Storefront state stays mounted when a product opens, so back navigation restores instantly.
- Store switching uses an in-memory cache only. Do not reintroduce scene/sessionStorage catalog caches.
- Product card images use Cloudinary responsive previews; product pages keep original image URLs.
- Admin mutations are protected on the backend, not only by the frontend route.
- One order belongs to one shop in the current model.
