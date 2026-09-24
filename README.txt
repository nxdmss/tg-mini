BRAND IDENTITY FIX

Что исправлено:

1. ZULF -> Zulfia ВЕЗДЕ на фронте.
   Даже если backend/БД всё ещё отдаёт "ZULF", пользователь увидит "Zulfia".

2. Zulfia получает рукописный стиль:
   iPhone/macOS -> Snell Roundhand
   другие системы -> script fallback.

3. SWA6Y5TAN -> SWAGYSTAN в отображаемом тексте.

4. SWAGYSTAN получает резкий gothic/action стиль:
   Copperplate + наклон + вытянутая форма + лёгкая обводка.
   Вдохновение: DMC3-era gothic action typography.
   Сам логотип игры не копируется.

5. Внутренние slug НЕ меняются:
   /shop/zulf
   /shop/swagystan
   Старые ссылки продолжают работать.

УСТАНОВКА

Распаковать ZIP в:

C:\Users\umarc\tg-mini

с заменой frontend/index.html.

Добавится:
frontend/src/brandRuntime.ts

ПОТОМ:

cd C:\Users\umarc\tg-mini\frontend
npm run build

Для локального просмотра:

npm run dev -- --host 0.0.0.0

Если всё нравится:

cd C:\Users\umarc\tg-mini
git add frontend/index.html frontend/src/brandRuntime.ts
git commit -m "update Zulfia and SWAGYSTAN branding"
git push origin main
