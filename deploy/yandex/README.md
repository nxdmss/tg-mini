# SWA6Y5TAN — Yandex Cloud migration pack

Цель: убрать production-зависимость от Vercel, Render и Cloudinary.

## Итоговая схема

- Frontend: Yandex Object Storage + Cloud CDN.
- API: Yandex Compute Cloud VM + Docker + Caddy.
- PostgreSQL: Yandex Managed Service for PostgreSQL.
- Product images: Yandex Object Storage.
- Telegram Bot/Mini App: тот же бот, меняется только Web App URL.

## Что уже меняет этот патч

1. Новые загрузки изображений товаров идут в Yandex Object Storage.
2. Есть idempotent-скрипт для переноса существующих Cloudinary изображений.
3. Backend готов к Docker production deploy.
4. Есть Docker Compose + HTTPS reverse proxy.
5. Есть скрипты dump/restore БД и frontend upload.
6. SPA routing учитывается через index.html как error page.

## Рекомендуемые production ресурсы

### Managed PostgreSQL

Использовать PostgreSQL 16.

Для production с высокой доступностью — несколько хостов в разных зонах.
Backend VM и PostgreSQL должны находиться в одной VPC.
Не открывайте PostgreSQL наружу после завершения миграции.

### Object Storage

Создать два отдельных bucket:

- `swa6-frontend-...` — frontend.
- `swa6-products-...` — изображения товаров.

Для media bucket:
- backend service account: роль `storage.uploader`;
- чтение изображений: публичное либо через CDN;
- записи/изменение конфигурации bucket не выдавать backend-сервису.

### Backend VM

Ubuntu LTS, публичный IP только для 80/443/SSH.
PostgreSQL — по private network.
На VM запускаются только API + Caddy.

## 1. Подготовка файлов

Из корня проекта:

```bash
cp backend/.env.example backend/.env.production
cp frontend/.env.yandex.example frontend/.env.production
cp deploy/yandex/.env.example deploy/yandex/.env
```

Заполнить реальные значения.

## 2. База

Сначала экспортируем старую production БД:

```bash
cd deploy/yandex

export SOURCE_DATABASE_URL='postgresql://...OLD...'
./db-export.sh
```

Создать Managed PostgreSQL в Yandex Cloud.

Для временного импорта можно включить публичный доступ только на время миграции
и использовать SSL. После миграции выключить публичный доступ.

Импорт:

```bash
export TARGET_DATABASE_URL='postgresql://...YANDEX...'
./db-import.sh tgmini.dump
```

После восстановления:

```bash
cd ../../backend
DATABASE_URL="$TARGET_DATABASE_URL" npx prisma migrate deploy
```

## 3. Media bucket

Создать статический ключ сервисного аккаунта для Object Storage.

В `backend/.env.production`:

```env
OBJECT_STORAGE_ENDPOINT=https://storage.yandexcloud.net
OBJECT_STORAGE_REGION=ru-central1
OBJECT_STORAGE_BUCKET=<media bucket>
OBJECT_STORAGE_ACCESS_KEY_ID=<key id>
OBJECT_STORAGE_SECRET_ACCESS_KEY=<secret>
MEDIA_PUBLIC_BASE_URL=https://storage.yandexcloud.net/<media bucket>
```

После настройки новой БД выполнить сначала dry run:

```bash
cd backend

DATABASE_URL="$TARGET_DATABASE_URL" \
DRY_RUN=1 \
node scripts/migrate-images-to-yandex.mjs
```

Затем реальный перенос:

```bash
DATABASE_URL="$TARGET_DATABASE_URL" \
node scripts/migrate-images-to-yandex.mjs
```

Скрипт использует `ProductImage.id` в ключе объекта, поэтому его можно безопасно
перезапускать после сбоя.

## 4. Backend VM

DNS A-запись:

```text
api.example.ru -> public IP VM
```

В `deploy/yandex/.env`:

```env
API_DOMAIN=api.example.ru
```

В `backend/.env.production`:

```env
BACKEND_URL=https://api.example.ru
FRONTEND_URL=https://app.example.ru
CORS_ORIGINS=https://app.example.ru
DATABASE_URL=postgresql://...YANDEX PRIVATE HOST...
```

На VM из корня репозитория:

```bash
cd deploy/yandex
./deploy-backend.sh
```

Caddy автоматически получает TLS-сертификат после того, как DNS указывает на VM.

Проверка:

```bash
API_URL=https://api.example.ru ./smoke-test.sh
```

## 5. Frontend

В `frontend/.env.production`:

```env
VITE_API_URL=https://api.example.ru
```

Установить AWS CLI и настроить только переменные окружения для upload service account.

```bash
cd deploy/yandex

export FRONTEND_BUCKET='<frontend bucket>'
export OBJECT_STORAGE_ACCESS_KEY_ID='...'
export OBJECT_STORAGE_SECRET_ACCESS_KEY='...'

./deploy-frontend.sh
```

В настройках frontend bucket:
- website index: `index.html`;
- website error page: `index.html`;
- чтение объектов: public.

После этого поставить Yandex Cloud CDN перед bucket и привязать `app.example.ru`.

## 6. Переключение без простоя

Порядок переключения:

1. Новая DB заполнена.
2. Старые изображения перенесены.
3. Новый API прошел smoke test.
4. Новый frontend проверен обычным браузером.
5. Проверить `/shop/zulf`, товар, корзину, заказ, `/admin`.
6. Переключить Telegram Mini App URL на новый frontend.
7. Старые Vercel/Render не удалять 48 часов — оставить rollback.
8. После проверки отключить Render/Vercel/Cloudinary.

## 7. Rollback

Пока старые сервисы не удалены:
- вернуть старый URL Mini App;
- вернуть старый frontend DNS;
- backend старой среды продолжает работать.

Не удаляйте старую БД до финальной сверки заказов и товаров.
