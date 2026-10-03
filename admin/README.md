# SWA6 Admin PWA

Отдельная минималистичная PWA-панель для заказов SWAGYSTAN.

## Что уже подключено

- реальный API `/orders/admin`;
- вход через существующий `/auth/login`;
- доступ только ролям `ADMIN` и `MANAGER`;
- номера заказов `SW_1`, `SW_2`, ...;
- фотографии товаров из `ProductImage`;
- статусы `NEW / PAID / SHIP / DONE / CANCEL`;
- автообновление каждые 5 секунд;
- системное уведомление о новом заказе, пока PWA запущена/остаётся активной в фоне;
- installable PWA + service worker;
- открытие заказа по нажатию на уведомление;
- mobile bottom sheet и desktop side sheet;
- никаких градиентов и лишнего дашборда.

## Переменная frontend

```env
VITE_API_URL=https://api.swagystan.ru
```

Она уже записана в `.env.production`.

## Что нужно сделать один раз на production

### 1. Backend env

В production `backend/.env` / `.env.production` должны быть:

```env
JWT_SECRET=<длинный случайный секрет>
CORS_ORIGINS="https://swagystan.ru,https://www.swagystan.ru,https://admin.swagystan.ru"
```

Не коммить секрет в Git.

### 2. Применить миграцию номера заказа

После `git pull`, но ДО перезапуска нового backend:

```bash
cd /opt/swa6

docker compose build backend
docker compose run --rm backend npx prisma migrate deploy
docker compose up -d backend
```

Миграция добавит последовательный `Order.number`. В интерфейсе он отображается как `SW_<number>`.

### 3. Сделать web-пользователя администратором

Сначала зарегистрировать обычного пользователя через существующий web auth, затем на сервере:

```bash
cd /opt/swa6

docker compose exec postgres psql -U tgmini -d tgmini -c \
  "UPDATE \"User\" SET role='ADMIN' WHERE email='YOUR_EMAIL';"
```

Пароль в базу руками не писать. После повышения роли обычный `/auth/login` выдаёт токен, а admin guard проверяет роль из БД на каждом запросе.

### 4. Собрать PWA

Из репозитория:

```bash
cd /opt/swa6/app/deploy/yandex
bash deploy-admin.sh
```

По умолчанию файлы попадут в:

```text
/opt/swa6/admin/dist
```

### 5. DNS

Создать A-запись:

```text
admin.swagystan.ru -> 158.160.138.84
```

### 6. Caddy

Добавить содержимое `deploy/yandex/Caddyfile.admin` в `/etc/caddy/Caddyfile`, затем:

```bash
sudo caddy validate --config /etc/caddy/Caddyfile
sudo systemctl reload caddy
```

Caddy сам запросит HTTPS-сертификат.

### 7. Backend CORS

После изменения `CORS_ORIGINS` пересоздать backend:

```bash
cd /opt/swa6
docker compose up -d --force-recreate backend
```

### 8. Установка на телефон

Открыть:

```text
https://admin.swagystan.ru
```

Войти admin email/password, нажать кнопку уведомлений в правом верхнем углу и разрешить уведомления. Затем добавить сайт на главный экран через браузер.

## Проверка API

После входа приложение должно получить:

```text
GET https://api.swagystan.ru/orders/admin
```

Смена статуса:

```text
PATCH https://api.swagystan.ru/orders/admin/<orderId>/status
```

Оба запроса идут с `Authorization: Bearer <JWT>`.

## Важно про уведомления

Текущая версия уведомляет о новых заказах через 5-секундный polling и Service Worker, пока приложение запущено или браузер сохраняет страницу активной. Полностью серверный Web Push при полностью закрытом приложении требует VAPID subscription storage на backend и вынесен отдельно, чтобы не добавлять ещё один секрет и новую production-зависимость до первого запуска.
