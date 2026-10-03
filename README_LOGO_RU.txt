SWA6 PWA LOGO PATCH V6

Что меняется:
- иконка PWA на iPhone/рабочем столе заменена на ваш SWAG-логотип;
- созданы PNG 180x180, 192x192, 512x512 и 1024x1024;
- apple-touch-icon теперь настоящий PNG;
- manifest использует PNG-иконки;
- push-уведомления тоже используют новый логотип;
- cache service worker поднят до v6.

Как применить через GitHub:
1. Распаковать ZIP поверх корня репозитория.
2. Commit + Push.

На сервере:
cd /opt/swa6/app && git pull --ff-only && cd admin && docker run --rm -v "$PWD":/app -w /app node:22-bookworm-slim sh -lc 'npm ci && npm run build' && sudo rm -rf /opt/swa6/admin/dist && sudo mkdir -p /opt/swa6/admin/dist && sudo cp -a dist/. /opt/swa6/admin/dist/ && sudo chmod -R a+rX /opt/swa6/admin/dist && sudo systemctl reload caddy && echo "ГОТОВО"

ВАЖНО ДЛЯ IPHONE:
iOS часто сохраняет старую иконку уже установленной PWA.
После обновления сервера удалите старую иконку SWA6 с экрана Домой и снова:
Safari -> admin.swagystan.ru -> Поделиться -> На экран Домой.
