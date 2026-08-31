STEP 20 — SIZE STOCK FIX + ADMIN BACK + CART ARROW

1) НОВЫЕ РАЗМЕРЫ БОЛЬШЕ НЕ СОЗДАЮТСЯ СО STOCK=0

Причина была в backend:
ProductSize.stock имеет Prisma default 0,
а форма администратора передаёт только название размера.

Теперь:
- новый товар в наличии: каждый новый размер получает stock=1;
- новый товар не в наличии: новый размер получает stock=0;
- при редактировании нормального товара существующий stock сохраняется;
- если старый сломанный товар имеет inStock=true и ВСЕ размеры stock=0,
  то после открытия этого товара в админке и повторного СОХРАНЕНИЯ
  эти размеры автоматически восстановятся до stock=1;
- если только один конкретный размер реально распродан (0),
  а другие размеры имеют stock > 0, этот 0 сохраняется.

2) АДМИНКА
Сверху добавлена кнопка:
‹ НАЗАД
Возвращает на главную витрину без перезагрузки.

3) КОРЗИНА
Левая стрелка в Cart/Checkout теперь визуально полностью такая же,
как стрелка назад на ProductDetail:
символ ‹
44x44
38px.

ВАЖНО:
STEP 19 анимации магазинов и товаров НЕ ТРОГАЛИСЬ.
Prisma/schema/DB migration НЕ НУЖНЫ.

ЗАМЕНА:
Распаковать содержимое ZIP в:
C:\Users\umarc\tg-mini
с заменой файлов.

ПРОВЕРКА BACKEND:
cd C:\Users\umarc\tg-mini\backend
npm run build

ПРОВЕРКА FRONTEND:
cd C:\Users\umarc\tg-mini\frontend
npm run build

ЕСЛИ ОБА BUILD ЗЕЛЁНЫЕ:
cd C:\Users\umarc\tg-mini
git add backend/src/products/products.service.ts frontend/src/pages/Admin.tsx frontend/src/pages/Admin.css frontend/src/components/ShopCommerceTheme.css
git commit -m "fix product sizes and navigation"
git push origin main

НЕ запускать prisma db push.
