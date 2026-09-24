SWAGYSTAN — CLEAN EDITORIAL STORE INDEX

Собрано поверх актуального GitHub main.

Заменяются только:
frontend/src/components/ShopSwitcher.tsx
frontend/src/components/ShopSwitcher.css
frontend/src/components/ShopHero.tsx
frontend/src/brandRuntime.ts

Что исправлено:
- полностью удалён runtime decorateShopDeck(), который ломал layout;
- никаких поисков кнопок по DOM и насильной перестановки элементов;
- новый switcher сделан напрямую в React;
- магазины теперь editorial grid, а не одна строка;
- тонкая верхняя линия;
- номер магазина 01 / 02;
- название крупно;
- количество товаров отдельно и тихо;
- SWAGYSTAN использует DMC5;
- межбуквенный интервал SWAGYSTAN плотный;
- Zulfia остаётся рукописной;
- Motion layoutId и текущая логика переходов сохранены;
- выбранный магазин по-прежнему переезжает в focus-state;
- исправлены сломанные aria-label в ShopSwitcher и ShopHero.

Установка:
распаковать ZIP в:
C:\Users\umarc\tg-mini

Проверка:
cd C:\Users\umarc\tg-mini\frontend
npm run dev -- --host 0.0.0.0

Потом:
npm run build

Если всё нравится:
cd C:\Users\umarc\tg-mini
git add frontend/src/components/ShopSwitcher.tsx frontend/src/components/ShopSwitcher.css frontend/src/components/ShopHero.tsx frontend/src/brandRuntime.ts
git commit -m "clean up shop switcher layout"
git push origin main
