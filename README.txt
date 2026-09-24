CLEAN HOME — TWO NAMES + ONE PHOTO

Сделано поверх актуального GitHub main.

Заменяются:
frontend/src/components/ShopSwitcher.tsx
frontend/src/components/ShopSwitcher.css
frontend/src/brandRuntime.ts

HOME (/):
- нет header;
- нет корзины;
- нет фильтров;
- нет каталога;
- нет footer;
- только два голых названия по центру:
  swagystan   Zulfia
- ниже одна большая фотография по центру;
- фотография берётся из первой доступной SWAGYSTAN-карточки;
- никаких подписей, рамок, полос и дополнительного UI.

ВЫБОР МАГАЗИНА:
- выбранное название через Motion layoutId переезжает в центр;
- Home-фото исчезает;
- открывается /shop/swagystan или /shop/zulf;
- ниже появляется обычный каталог;
- клик по центральному названию возвращает на Home.

ВАЖНО:
- исправлено наложение глобального brandRuntime на ShopSwitcher;
- поэтому размеры больше не умножаются;
- Zulfia и DMC5 остаются своими шрифтами;
- App.tsx не заменяется и не ломается.

Установка:
распаковать ZIP в:
C:\Users\umarc\tg-mini

Проверка:
cd C:\Users\umarc\tg-mini\frontend
npm run dev -- --host 0.0.0.0

Потом:
npm run build
