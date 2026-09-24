ZULF -> Zulfia BRAND PATCH

Что делает:
- публичное название ZULF меняет на Zulfia;
- slug "zulf" НЕ меняется, поэтому старые ссылки не ломаются;
- Zulfia получает аккуратный рукописный стиль;
- на iPhone используется Snell Roundhand;
- Google Fonts не используется: нет дополнительной внешней загрузки;
- анимации, каталог, ZULF/Zulfia-тема, товары и маршруты не меняются.

Установка:
1. Распакуй содержимое ZIP в корень:
   C:\Users\umarc\tg-mini

2. Запусти:
   APPLY_ZULFIA_PATCH.cmd

3. Потом:
   cd C:\Users\umarc\tg-mini\frontend
   npm run build

4. Если build зелёный:
   cd C:\Users\umarc\tg-mini
   git add -A
   git commit -m "rename ZULF to Zulfia"
   git push origin main

Патч автоматически создаёт .zulfia-backup рядом с файлами, которые он меняет.
После проверки сайта эти backup-файлы можно удалить перед git add:

PowerShell:
Get-ChildItem -Recurse -Filter *.zulfia-backup | Remove-Item

Важно:
сам slug остаётся /shop/zulf — это специально, чтобы не ломать существующие ссылки.
