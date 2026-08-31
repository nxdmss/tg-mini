STEP 17 — RECOVERY + STABLE PRODUCT FLOW

ЭТО ВАЖНО:
STEP 16 scene cache ПОЛНОСТЬЮ ОТКАЧЕН.
В App.tsx больше нет:
- catalogSceneCache;
- sessionStorage сцен;
- preload blocking;
- scenesReady;
- подмены shop state из scene cache.

ВОЗВРАЩЕНА СТАБИЛЬНАЯ ЛОГИКА STEP 15:
- "/" = базовый SWA6Y5TAN catalog;
- строка SWA6Y5TAN / ZULF работает нормально;
- нажал магазин -> открывается именно он;
- нажал крупное название -> возврат в базовый SWA6Y5TAN;
- ZULF white SWAG logo сохранён;
- shop product theme + SWAG CORE cart/checkout сохранены.

ПРЕДЗАГРУЗКА:
- остаётся только простой RAM ref-cache каталога;
- фоновые запросы НЕ меняют React state;
- нет sessionStorage;
- нет блокировки интерфейса до полной загрузки всех магазинов;
- прогревается preview image каждой карточки через browser cache + decode().

АНИМАЦИЯ ТОВАРОВ:
- весь интерфейс больше не двигается;
- filters/header/shop switcher стоят на месте;
- при смене магазина новый массив товаров ставится атомарно;
- каждая новая карточка:
  opacity 0 -> 1
  y 16 -> 0
  scale .988 -> 1
- duration 260ms;
- stagger 22ms, максимум 160ms;
- ощущение быстрой волны снизу вверх;
- старый CSS card animation отключён, чтобы две анимации не дрались.

НЕТ:
- AnimatePresence mode=wait;
- skeleton во время обычного switch, если магазин уже prefetched;
- анимации всей высоты каталога;
- scrollbar-gutter;
- scene preload.

Если после STEP 16 у тебя локально остался файл:
frontend/src/catalogSceneCache.ts
он больше НИГДЕ не импортируется. Его можно удалить, но на работу он не влияет.

Распаковать в:
C:\Users\umarc\tg-mini
с заменой.

Проверка:
cd C:\Users\umarc\tg-mini\frontend
npm run build

Пока НЕ пушить до успешного build.
