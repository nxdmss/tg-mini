STEP 21 — PERSISTENT STOREFRONT / ZERO-LOAD PRODUCT BACK

ПРИЧИНА БАГА БЫЛА В ROUTER:
Раньше было 5 отдельных <Route>, и каждый создавал свой <App />:
- /
- /catalog
- /product/:id
- /shop/:shopSlug
- /shop/:shopSlug/product/:id

Из-за этого переход catalog -> product мог размонтировать App.
При back новый App начинал загрузку каталога заново.

ТЕПЕРЬ:
1. /admin остаётся отдельным route.
2. ВСЯ витрина работает через ОДИН route:
   /*
3. App сам разбирает storefront URL.
4. Поэтому App вообще не размонтируется между:
   /
   /catalog
   /product/:id
   /shop/zulf
   /shop/zulf/product/:id

ГЛАВНОЕ:
ProductDetail больше не заменяет catalog.
Он открывается fixed overlay-слоем СВЕРХУ.

Под ним остаются ЖИВЫМИ:
- те же ProductCard DOM nodes;
- те же <img>;
- тот же products state;
- тот же shop;
- те же filters;
- тот же scroll;
- тот же RAM cache.

BACK ИЗ ТОВАРА:
- НЕ вызывает getShopProducts;
- НЕ включает loading;
- НЕ показывает skeleton;
- НЕ remount-ит карточки;
- НЕ запускает их entrance animation заново;
- просто убирает ProductDetail layer и показывает каталог, который всё это время был под ним.

DIRECT LINK:
Если пользователь сразу открывает /shop/zulf/product/ID:
- ProductDetail грузится как обычно;
- catalog ZULF параллельно готовится под ним;
- после back каталог уже готов.

БИБЛИОТЕКИ:
Новая библиотека НЕ нужна.
Motion остаётся для shop/card animation.
TanStack Query тут не нужен для исправления этого бага:
проблема была в lifecycle/router, а не в HTTP cache.

ИЗМЕНЕНО:
frontend/src/App.tsx
frontend/src/router.tsx

ДОБАВЛЕНО:
frontend/src/components/ProductOverlay.css

STEP 20 размеры/admin back/cart arrow НЕ ПЕРЕЗАПИСЫВАЮТСЯ.

ПРОВЕРКА:
cd C:\Users\umarc\tg-mini\frontend
npm run build

ЕСЛИ BUILD ЗЕЛЁНЫЙ:
cd C:\Users\umarc\tg-mini
git add frontend/src/App.tsx frontend/src/router.tsx frontend/src/components/ProductOverlay.css
git commit -m "keep storefront mounted across product routes"
git push origin main
