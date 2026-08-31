STEP 18 — CART TEXT ONLY + NO SAME-SHOP RELOAD

1. КОРЗИНА В HEADER
- убрана рамка/квадрат;
- убран белый фон;
- это просто слово "КОРЗИНА";
- счётчик тоже без кружка/рамки;
- цвет текста следует интерфейсу магазина:
  SWA6Y5TAN -> чёрный,
  ZULF -> белый.

2. SWA6Y5TAN НЕ ПЕРЕЗАГРУЖАЕТ ТОВАРЫ ПРИ ПОВТОРНОМ КЛИКЕ
Причина была в сравнении shopSlug вместо activeShopSlug.
На "/" activeShopSlug уже = "swagystan", хотя shopSlug отсутствует.

Теперь:
- на базовом "/" нажал SWA6Y5TAN -> только визуально название идёт в focus;
- данные магазина НЕ меняются;
- URL НЕ меняется;
- setProducts НЕ вызывается;
- API НЕ вызывается;
- карточки НЕ монтируются заново;
- нажал SWA6Y5TAN повторно -> название возвращается в строку;
- товары остаются ровно теми же и не анимируются повторно.

ZULF <-> SWA6Y5TAN работает как раньше, с плавным product flow.

Изменено:
frontend/src/App.tsx
frontend/src/components/ShopCommerceTheme.css

ПРОВЕРКА:
cd C:\Users\umarc\tg-mini\frontend
npm run build

Если build зелёный:
cd C:\Users\umarc\tg-mini
git add frontend/src/App.tsx frontend/src/components/ShopCommerceTheme.css
git commit -m "fix cart button and same shop reload"
git push origin main
