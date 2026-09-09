STEP 31 — HARD ADMIN TELEGRAM ID LOCK

Что исправлено:

1. AdminGuard больше НЕ доверяет роли из БД.
2. Он напрямую сравнивает:
   request.user.telegramId
   с ID из Render env.

Поддерживаются ОБА варианта env:

ADMIN_TELEGRAM_ID=123456789

или

ADMIN_TELEGRAM_IDS=123456789

Для нескольких:
ADMIN_TELEGRAM_IDS=123456789,987654321

3. Если env отсутствует -> доступ закрыт.
4. Если telegramId отсутствует -> доступ закрыт.
5. Если ID не совпал -> 403.
6. Добавлен отдельный endpoint:
   GET /auth/admin-check
   под TelegramAuthGuard + AdminGuard.
7. Frontend /admin проверяет ТОЛЬКО этот endpoint.
8. Никаких cachedAccess.
9. Никаких role === ADMIN.
10. Никакой проверки через shops.

ВАЖНО НА RENDER BACKEND:

TELEGRAM_AUTH_DISABLED=false

И ОДНА из переменных:

ADMIN_TELEGRAM_ID=ТВОЙ_ЦИФРОВОЙ_ID

ИЛИ

ADMIN_TELEGRAM_IDS=ТВОЙ_ЦИФРОВОЙ_ID

Не username.
Не @name.
Именно numeric Telegram user id.

После распаковки:

BACKEND:
cd C:\Users\umarc\tg-mini\backend
npm run build

FRONTEND:
cd C:\Users\umarc\tg-mini\frontend
npm run build

Если оба зелёные:

cd C:\Users\umarc\tg-mini
git add backend/src/auth/admin.guard.ts backend/src/auth/auth.controller.ts frontend/src/adminAccessApi.ts frontend/src/components/AdminGate.tsx
git commit -m "hard lock admin to telegram id"
git push origin main
