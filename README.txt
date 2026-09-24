MINIMAL STORE ZONE

Собрано поверх актуального GitHub main.

Заменяются только:
frontend/src/components/ShopSwitcher.tsx
frontend/src/components/ShopSwitcher.css

Что изменено:
- отдельная компактная зона магазинов;
- спокойный фон var(--surface);
- нет полос, рамок и номеров;
- нет огромных названий;
- SWAGYSTAN и Zulfia аккуратно стоят рядом;
- маленькая подпись МАГАЗИНЫ;
- при выборе магазин остаётся внутри этой же зоны;
- количество товаров показывается тихо справа;
- Motion-анимация и layoutId сохранены;
- brandRuntime, каталог и остальные компоненты не трогаются.

Распаковать в:
C:\Users\umarc\tg-mini

Проверка:
cd C:\Users\umarc\tg-mini\frontend
npm run dev -- --host 0.0.0.0

Потом:
npm run build
