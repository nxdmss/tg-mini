SWAGYSTAN — ПОЛНЫЙ НАБОР ИЗМЕНЁННЫХ ФАЙЛОВ

Исправлено:
- Цифры IZLOM сделаны заметно толще, включая цены, размеры, поиск,
  корзину, количество и заполнение заказа.
- В разделе «О нас» сверху и снизу: KIZILURT | DAGESTAN.
  Каждая надпись строго в ОДНУ строку, текст легче и не такой жирный.
- Сердечки поверх фото товара и каждой карточки, без круглой подложки.
- Остальное из предыдущего ZIP сохранено.

Установка: распакуй содержимое ZIP в КОРЕНЬ проекта с заменой файлов,
отправь изменения в GitHub (в ветку main или слей PR).

ВАЖНО: исходные файлы IZLOM уже должны лежать в проекте:
frontend/public/fonts/IZLOM_Narrow-Regular.woff2
frontend/public/fonts/IZLOM_Narrow-Regular.ttf
Не удаляй frontend/.env.production.

Обновление сервера после попадания коммита в main:
cd /opt/swa6/app && git pull --ff-only && cd frontend && npm ci && npm run build && sudo cp -a dist/. /var/www/swagystan/
