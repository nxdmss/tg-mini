STEP 24 — ADMIN LOCK

Задача:
в /admin может попасть только Telegram аккаунт,
чей Telegram ID указан на Render в:

ADMIN_TELEGRAM_IDS

Как работает:
1. При входе на /admin frontend НЕ рендерит Admin сразу.
2. AdminGate отправляет защищённый запрос:
   GET /shops/admin/all
3. Backend проверяет:
   TelegramAuthGuard
   +
   AdminGuard
4. AdminGuard сравнивает telegramId пользователя
   с ADMIN_TELEGRAM_IDS из Render.
5. Если это твой аккаунт:
   200 -> Admin открывается.
6. Если любой другой аккаунт:
   403 -> frontend сразу делает redirect на "/".
7. Пока проверка идёт, показывается просто белый экран,
   чтобы интерфейс Admin даже на миллисекунду не мелькал.

ВАЖНО:
НЕ добавляй Telegram ID во frontend/Vercel env.
ADMIN_TELEGRAM_IDS должен оставаться только на backend Render.

На Render должно быть:
Key:
ADMIN_TELEGRAM_IDS

Value:
твой Telegram numeric ID

Если админов несколько:
123456789,987654321

Без кавычек.

Также обязательно:
TELEGRAM_AUTH_DISABLED=false

Изменено:
frontend/src/router.tsx

Добавлено:
frontend/src/components/AdminGate.tsx

Persistent storefront из STEP 21/22 сохранён:
- /admin отдельный route
- вся витрина через /*
- карточка товара не ломает каталог.

ПРОВЕРКА:
cd C:\Users\umarc\tg-mini\frontend
npm run build

Если build зелёный:
cd C:\Users\umarc\tg-mini
git add frontend/src/router.tsx frontend/src/components/AdminGate.tsx
git commit -m "lock admin route to backend admin"
git push origin main
