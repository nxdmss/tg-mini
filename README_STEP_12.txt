STEP 12 — SMOOTH SHOP MOTION

Исправлено:
- Полностью удалена надпись "МАГАЗИН" под главным SWAG logo.
- Базово остаётся строка:
  SWA6Y5TAN   ZULF   ...
- Базовый каталог SWA6Y5TAN остаётся как раньше.
- На базовом экране ни один магазин не выделен.
- При выборе магазин плавно переносится в главное место.
- При возврате название плавно возвращается обратно в строку.

Главный фикс дёрганья:
- выбранное название теперь LOCKED до загрузки реального нового магазина;
- старый shop больше не может на мгновение перезаписать выбранное название;
- поэтому больше не должно быть:
  ZULF -> SWA6Y5TAN -> ZULF.

Оптимизация анимаций:
- убран CSS blur/filter из смены каталога;
- основные переходы теперь только opacity + translate3d;
- используется GPU-friendly transform;
- убран конфликт smooth scroll скрытой строки с анимацией названия;
- скрытая строка позиционируется мгновенно, пока её не видно;
- уменьшены лишние stagger delays карточек;
- добавлен backface-visibility для более стабильного рендера на мобильных.

Backend / Prisma / DB не трогаем.

Скопировать frontend из архива в:
C:\Users\umarc\tg-mini
с заменой файлов.

Проверка:
cd C:\Users\umarc\tg-mini\frontend
npm run build

Если build зелёный:
cd C:\Users\umarc\tg-mini
git add frontend/src/components/ShopSwitcher.tsx frontend/src/components/ShopSwitcher.css frontend/src/components/ShopTransitions.css
git commit -m "smooth shop switching animation"
git push origin main
