STEP 15 — SHOP PRODUCT THEME + SWAG CORE CHECKOUT

ЛОГИКА ТЕМЫ:

1. КАТАЛОГ И КАРТОЧКИ ТОВАРОВ = ТЕМА МАГАЗИНА
   В ZULF они становятся частью ZULF:
   - текст карточек;
   - бренд;
   - категория;
   - пустое фото;
   - фильтры / поиск;
   - состояния.

2. СТРАНИЦА ТОВАРА = ПРОДОЛЖЕНИЕ МАГАЗИНА
   В ZULF:
   - фон ProductDetail становится фоном ZULF;
   - название / цена / описание / стрелки / точки / размеры используют цвета ZULF;
   - больше нет внезапного белого экрана после открытия товара.

3. SWAG CORE = ВСЕГДА ЧЁРНО-БЕЛЫЙ
   Не зависит от магазина:
   - кнопка КОРЗИНА в header;
   - кнопка КОРЗИНА на странице товара;
   - ДОБАВИТЬ В КОРЗИНУ;
   - CartDrawer;
   - оформление заказа;
   - поля;
   - доставка / самовывоз;
   - итог заказа;
   - подтверждение заказа.

4. ZULF WHITE SWAG LOGO ИЗ STEP 14B СОХРАНЁН.

Изменено:
frontend/src/App.tsx

Добавлено:
frontend/src/components/ShopCommerceTheme.css

Backend / Prisma / DB НЕ ТРОГАТЬ.

После распаковки:
cd C:\Users\umarc\tg-mini\frontend
npm run build

Если build зелёный:
cd C:\Users\umarc\tg-mini
git add frontend/src/App.tsx frontend/src/components/ShopCommerceTheme.css
git commit -m "theme products by shop and keep checkout core"
git push origin main
