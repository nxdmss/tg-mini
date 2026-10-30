# SWAGYSTAN

Магазин одежды swagystan.ru. Одна публичная витрина, аккаунты с подтверждением почты, корзина, избранное и заказы.

## Структура

- `frontend/` — React, TypeScript, Vite: магазин и веб-админка.
- `backend/` — NestJS, Prisma, PostgreSQL: API и серверная авторизация.
- `backend/src/auth/email/` — шаблон письма и отрисовка фирменных цифр.
- `admin/` — отдельная PWA для управления заказами.
- `deploy/yandex/` — настройки Caddy, контейнеров и инструкции для сервера.
- `scripts/` — обновление сервера и сборка ресурсов шрифта.

## Разработка

Нужны Node.js 22 и PostgreSQL. Настройки берутся из `.env.example` соответствующего приложения. Рабочие `.env` и пароли не коммитятся.

```sh
npm run setup
npm run build
node --test backend/test/email-auth.cjs backend/test/email-template.cjs backend/test/shopping.cjs
```

Основные маршруты: `/`, `/favorites`, `/about`, `/account`, `/product/:id`, `/admin`, `/admin/visitors`.

## Продакшен

Сайт работает на Яндекс-сервере. Caddy обслуживает `/var/www/swagystan`, API работает в контейнере `swa6-backend-1`. Настройки backend находятся в `/opt/swa6/app/backend/.env` и подключены через Compose. Настройка писем описана в [backend/EMAIL_AUTH.md](backend/EMAIL_AUTH.md).

Обновление с повторным использованием движков Prisma из работающего образа:

```sh
(
set -e
cd /opt/swa6/app
git fetch origin main
UPDATE_SCRIPT=$(mktemp)
trap 'rm -f "$UPDATE_SCRIPT"' EXIT
git show origin/main:scripts/deploy-yandex-reuse-prisma.py > "$UPDATE_SCRIPT"
python3 "$UPDATE_SCRIPT"
)
```

Скрипт проверяет совпадение версий движков, делает резервные копии, собирает приложения и проверяет API перед публикацией витрины. Устаревшие публичные ресурсы удаляются только по явному списку `scripts/retired-frontend-assets.txt`. Старые хешированные JS/CSS временно сохраняются для открытых вкладок.

Стандартный `scripts/deploy-yandex.sh` требует доступного скачивания движков Prisma. `scripts/deploy-digits.sh` нужен только для отдельного обновления типографики, `scripts/refresh-frontend.sh` — только для изменений интерфейса при совместимом backend.

## Совместимость данных

Таблицы магазинов, существующие связи товаров/заказов, API админки и история миграций сохранены. Публичная витрина показывает SWAGYSTAN. Удаление старого интерфейса не удаляет записи из базы и не переносит товары между магазинами.
