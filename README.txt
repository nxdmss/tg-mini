DMC5 REAL FONT FIX

Причина:
Dmc5 Font By Kalina Ann использует lowercase-глифы.
Раньше код принудительно делал SWAGYSTAN uppercase,
поэтому браузер мог показывать fallback.

Что исправлено:
- визуальный текст передаётся шрифту как "swagystan";
- text-transform: uppercase удалён;
- ширина и живой стиль сохранены;
- Zulfia не трогается.

Распакуй ZIP в:
C:\Users\umarc\tg-mini

с заменой:
frontend\src\brandRuntime.ts

Твой файл шрифта должен уже лежать:
frontend\public\fonts\dmc5-kalina-ann.ttf
ИЛИ .otf / .woff / .woff2

Потом полностью останови старый dev-server (Ctrl+C) и запусти:

cd C:\Users\umarc\tg-mini\frontend
npm run dev -- --host 0.0.0.0

В браузере сделай Ctrl+F5.
