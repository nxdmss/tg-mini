SWAGYSTAN FINAL REPLACE FILES

Что внутри:
- frontend/src/App.tsx
- frontend/src/favorites.ts
- frontend/src/components/ProductDetail.tsx
- frontend/src/components/SwagOnly.css
- frontend/public/icons/swag-heart-outline.svg
- frontend/public/icons/swag-heart-filled.svg
- frontend/public/fonts/IZLOM_Narrow-Regular.woff2
- frontend/public/fonts/IZLOM_Narrow-Regular.ttf

Что изменено:
1) Лайк на странице товара перенесён поверх фото.
2) Лайк добавлен на каждую карточку товара сверху справа.
3) Раздел "О нас" заменён на обычный текст KIZILURT | DAGESTAN сверху и снизу.
4) Для цифр подключен шрифт IZLOM Narrow.

Как применить:
- Распакуй архив в корень проекта с заменой файлов.
- Сделай commit/push в GitHub.
- На сервере: git pull, npm ci, npm run build, затем скопируй dist в /var/www/swagystan.
