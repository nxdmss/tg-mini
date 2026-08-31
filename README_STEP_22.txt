STEP 22 — SLOW LIQUID PRODUCT FLOW

Поверх STEP 21 persistent storefront.

Что изменено ТОЛЬКО в анимации товаров:
- opacity 0 -> 1
- y 22px -> 0
- duration 460ms
- stagger 42ms между карточками
- максимальная задержка волны 300ms
- easing cubic-bezier(0.16, 1, 0.3, 1)
- НЕТ scale
- НЕТ blur

Результат:
при смене магазина товары медленнее и мягче "вытекают"
снизу вверх красивой волной.

ВАЖНО:
- persistent storefront STEP 21 сохранён;
- карточка товара по-прежнему overlay;
- назад из товара не перезагружает каталог;
- товары не анимируются заново после back из ProductDetail;
- header / filters / selector не двигаются;
- backend / admin / размеры STEP 20 не затрагиваются.

Файлы в архиве:
frontend/src/App.tsx
frontend/src/router.tsx
frontend/src/components/ProductOverlay.css

router.tsx и ProductOverlay.css те же, что в STEP 21.
Главное изменение — App.tsx.

Проверка:
cd C:\Users\umarc\tg-mini\frontend
npm run build

Если build зелёный:
cd C:\Users\umarc\tg-mini
git add frontend/src/App.tsx frontend/src/router.tsx frontend/src/components/ProductOverlay.css
git commit -m "slow down product flow animation"
git push origin main
