SWA6 GOOGLE TITLE FIX

Цель:
сделать максимально однозначным для Google, что синяя кликабельная строка результата должна называться:

SWAGYSTAN

Без "Магазин одежды".

Что меняется:
- <title> остаётся ровно SWAGYSTAN;
- добавляется application-name;
- description/OG/Twitter приводятся к SWAGYSTAN;
- добавляется WebSite JSON-LD name=SWAGYSTAN;
- старые SWA6Y5TAN в Header/footer заменяются на SWAGYSTAN.

Как применить:
1. Распаковать ZIP в корень tg-mini.
2. В терминале из корня:
   py APPLY_PATCH.py
3. GitHub Desktop:
   Commit -> Push
4. На сервере пересобрать frontend.
5. Потом в Google Search Console запросить повторную индексацию главной.

Важно:
Google не гарантирует буквальное использование <title> и иногда переписывает title link.
Этот патч убирает противоречивые сигналы и делает SWAGYSTAN главным названием во всех основных местах.
