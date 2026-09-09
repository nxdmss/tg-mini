STEP 30 — ADMIN ACCESS RECHECK

Исправлена ошибка безопасности во frontend:

БЫЛО:
AdminGate кэшировал successful admin check глобально:
cachedAccess = "allowed"

После этого в том же живом WebView повторный вход в /admin
мог пройти без нового запроса к backend.

СТАЛО:
Каждый новый mount /admin ВСЕГДА делает:
GET /shops/admin/all

Backend затем выполняет:
TelegramAuthGuard + AdminGuard

И AdminGuard сравнивает реальный Telegram ID
с ADMIN_TELEGRAM_IDS на Render.

Чужой Telegram:
403 -> redirect "/"

Твой Telegram:
200 -> Admin render

Заменить:
frontend/src/components/AdminGate.tsx

Проверка:
cd C:\Users\umarc\tg-mini\frontend
npm run build

Если зелёный:
cd C:\Users\umarc\tg-mini
git add frontend/src/components/AdminGate.tsx
git commit -m "always recheck admin access"
git push origin main

На Render:
ADMIN_TELEGRAM_IDS=ТВОЙ_ID
TELEGRAM_AUTH_DISABLED=false
