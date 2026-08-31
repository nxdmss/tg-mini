STEP 13 — MOTION / НОРМАЛЬНЫЕ SHARED-LAYOUT АНИМАЦИИ

Что изменено:
- ручной перелёт через getBoundingClientRect / Web Animations API полностью удалён;
- ручные setTimeout для координации визуального перелёта удалены;
- переключатель магазинов переведён на Motion for React;
- используется layoutId для одного и того же названия магазина в строке и в главном месте;
- используется LayoutGroup;
- используется AnimatePresence для плавной смены каталога/фильтров;
- новый магазин и его товары сначала загружаются в память;
- только после успешной загрузки каталог заменяется;
- при смене магазина нет промежуточного SWA6Y5TAN между ZULF и ZULF;
- базовое состояние остаётся:
  SWA6Y5TAN   ZULF   ...
  и обычный каталог SWA6Y5TAN;
- на базовом экране никто не выбран;
- нажал магазин -> имя плавно переезжает в главное место;
- нажал крупное имя -> оно возвращается в строку;
- надписи "МАГАЗИН" под SWAG logo нет;
- тяжёлые blur/filter анимации не используются;
- CSS и Motion больше не анимируют ProductCard transform одновременно.

Новая зависимость:
motion ^13.1.1

ВАЖНО:
После замены файлов один раз выполнить npm install,
потому что появилась новая библиотека Motion.
npm install сам обновит package-lock.json.

Backend / Prisma / DB НЕ ТРОГАТЬ.

Установка:
cd C:\Users\umarc\tg-mini\frontend
npm install

Потом:
npm run build

Если build зелёный:
cd C:\Users\umarc\tg-mini
git add .
git commit -m "switch shop animations to motion"
git push origin main
