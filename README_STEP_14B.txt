STEP 14B — WHITE SWAG LOGO IN ZULF

Что изменено:
- При входе в магазин ZULF главный SWAG logo становится белым.
- При возврате в SWA6Y5TAN / базовое состояние logo снова чёрный.
- Используется НЕ анимация filter.
- Два одинаковых слоя logo лежат строго друг над другом:
  1) обычный чёрный;
  2) статический белый negative.
- Между ними идёт короткий crossfade 120ms.
- Поэтому размер и позиция logo вообще не меняются и не дёргаются.
- Смена происходит одновременно со сменой текущего shop state.

Изменены:
frontend/src/App.tsx
frontend/src/components/Header.tsx
frontend/src/components/Header.css

Backend / Prisma / DB не трогаем.

После замены:
cd C:\Users\umarc\tg-mini\frontend
npm run build

Если зелёный:
cd C:\Users\umarc\tg-mini
git add frontend/src/App.tsx frontend/src/components/Header.tsx frontend/src/components/Header.css
git commit -m "add zulf negative logo"
git push origin main
