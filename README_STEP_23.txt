STEP 23 — subtle "jopa" in header

Добавлено:
- маленькая надпись "jopa" ровно по центру шапки;
- desktop: 9px, opacity 0.12;
- mobile: 8px, opacity 0.10;
- pointer-events: none;
- не двигает SWAG logo и корзину;
- в ZULF автоматически становится еле заметной светлой;
- в SWA6Y5TAN — еле заметной тёмно-серой.

Изменено только:
frontend/src/components/Header.tsx
frontend/src/components/Header.css

Проверка:
cd C:\Users\umarc\tg-mini\frontend
npm run build

Если зелёный:
cd C:\Users\umarc\tg-mini
git add frontend/src/components/Header.tsx frontend/src/components/Header.css
git commit -m "add subtle center header label"
git push origin main
