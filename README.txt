SWAGYSTAN RAZOR FONT FIX

Только один файл на замену:
frontend/src/brandRuntime.ts

Что меняется:
- Zulfia вообще не трогается.
- SWAGYSTAN становится гораздо более острым, злым и рваным.
- Без Google Fonts и без npm install.
- Используются встроенные serif-шрифты + агрессивная CSS-обработка.
- Добавлены рваные blade-slices через pseudo-elements.

Распаковать в:
C:\Users\umarc\tg-mini

Потом:
cd C:\Users\umarc\tg-mini\frontend
npm run dev -- --host 0.0.0.0

Если нравится:
npm run build
