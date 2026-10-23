SWAGYSTAN — ПОЛНЫЙ ZIP ДЛЯ ЗАМЕНЫ ФАЙЛОВ

Исправления:
- Цифры IZLOM визуально жирнее (синтетическое утолщение штатного Regular).
- Утолщение включено для цен, размеров, поиска, полей заказа, корзины и счётчиков.
- Сердца — БЕЗ подложек, поверх изображений.
- В «О нас» — KIZILURT | DAGESTAN сверху и снизу.

Распакуй ZIP в корень репозитория tg-mini с заменой.
Не удаляй frontend/.env.production.

Шрифт берётся из ТВОЕГО ранее предоставленного архива
IZLOM_Narrow_font(1).zip. Он НЕ входит в ZIP с кодом.
Убедись, что эти два файла уже лежат в проекте:
 frontend/public/fonts/IZLOM_Narrow-Regular.woff2
 frontend/public/fonts/IZLOM_Narrow-Regular.ttf

После отправки изменений в GitHub и попадания в main:
cd /opt/swa6/app && git pull --ff-only && cd frontend && npm ci && npm run build && sudo cp -a dist/. /var/www/swagystan/
