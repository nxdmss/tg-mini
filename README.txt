HOME EAGLE.JPG — 16:9 FIX

Исправлено специально под фотографию 16:9.

Фото:
C:\Users\umarc\tg-mini\frontend\public\eagle.JPG

Что изменено:
- контейнер Home-фото теперь имеет aspect-ratio: 16 / 9;
- убрана фиксированная высокая вертикальная высота;
- object-fit: cover заменён на object-fit: contain;
- eagle.JPG показывается целиком без обрезки;
- фото стало шире и аккуратно центрируется;
- остальной Home и логика магазинов не менялись.

Заменить:
frontend\src\components\ShopSwitcher.css

ZIP также содержит остальные файлы текущей Home-версии для удобства.

Проверка:
cd C:\Users\umarc\tg-mini\frontend
npm run dev -- --host 0.0.0.0
