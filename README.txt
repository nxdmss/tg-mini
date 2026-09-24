CLEAN HOME — EAGLE.JPG

Этот вариант использует твою собственную Home-фотографию.

Положи файл:
frontend\public\eagle.jpg

Заменяются:
frontend\src\components\ShopSwitcher.tsx
frontend\src\components\ShopSwitcher.css
frontend\src\brandRuntime.ts

HOME:
- только swagystan и Zulfia;
- ниже одна большая фотография eagle.jpg;
- нет header, корзины, фильтров, каталога, footer, рамок и подписей;
- после выбора магазина фотография исчезает;
- выбранное название переезжает в центр;
- появляется каталог выбранного магазина.

Важно:
ZIP НЕ содержит eagle.jpg.
Ты кладёшь свою фотографию самостоятельно в:
C:\Users\umarc\tg-mini\frontend\public\eagle.jpg

Проверка:
cd C:\Users\umarc\tg-mini\frontend
npm run dev -- --host 0.0.0.0
