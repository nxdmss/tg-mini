#!/usr/bin/env bash
set -euo pipefail

APP_DIR="${APP_DIR:-/opt/swa6/app}"
STACK_DIR="${STACK_DIR:-/opt/swa6}"
BACKEND_ENV="$APP_DIR/backend/.env"

if [ ! -d "$APP_DIR/backend" ]; then
  echo "Не найден backend: $APP_DIR/backend"
  exit 1
fi

cd "$STACK_DIR"

echo "==> Запускаю PostgreSQL"
docker compose up -d postgres

echo "==> Делаю backup базы"
mkdir -p backups
STAMP="$(date +%Y%m%d-%H%M%S)"
docker compose exec -T postgres sh -lc \
  'pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB"' \
  > "backups/before-web-push-$STAMP.sql"

echo "==> Проверяю VAPID ключи"
if ! grep -Eq '^VAPID_PUBLIC_KEY="?[A-Za-z0-9_-]+"?$' "$BACKEND_ENV" 2>/dev/null || \
   ! grep -Eq '^VAPID_PRIVATE_KEY="?[A-Za-z0-9_-]+"?$' "$BACKEND_ENV" 2>/dev/null; then

  KEYS_JSON="$(
    docker run --rm node:22-bookworm-slim node -e '
      const crypto = require("crypto");
      const { publicKey, privateKey } = crypto.generateKeyPairSync("ec", {
        namedCurve: "prime256v1",
      });
      const pub = publicKey.export({ format: "jwk" });
      const priv = privateKey.export({ format: "jwk" });
      const rawPublic = Buffer.concat([
        Buffer.from([4]),
        Buffer.from(pub.x, "base64url"),
        Buffer.from(pub.y, "base64url"),
      ]).toString("base64url");
      process.stdout.write(JSON.stringify({
        publicKey: rawPublic,
        privateKey: priv.d,
      }));
    '
  )"

  sudo python3 - "$BACKEND_ENV" "$KEYS_JSON" <<'PY'
from pathlib import Path
import json
import sys

path = Path(sys.argv[1])
keys = json.loads(sys.argv[2])

updates = {
    "VAPID_SUBJECT": "https://swagystan.ru",
    "VAPID_PUBLIC_KEY": keys["publicKey"],
    "VAPID_PRIVATE_KEY": keys["privateKey"],
}

lines = path.read_text(encoding="utf-8").splitlines()
seen = set()
out = []

for line in lines:
    replaced = False
    for key, value in updates.items():
        if line.startswith(key + "="):
            out.append(f'{key}="{value}"')
            seen.add(key)
            replaced = True
            break
    if not replaced:
        out.append(line)

if out and out[-1] != "":
    out.append("")

for key, value in updates.items():
    if key not in seen:
        out.append(f'{key}="{value}"')

path.write_text("\n".join(out) + "\n", encoding="utf-8")
PY

  echo "==> VAPID ключи созданы и сохранены в backend/.env"
else
  echo "==> VAPID ключи уже есть, оставляю как есть"
fi

echo "==> Собираю backend"
docker compose build backend

echo "==> Применяю миграции"
docker compose run --rm backend npx prisma migrate deploy

echo "==> Перезапускаю backend"
docker compose up -d backend

echo "==> Собираю admin PWA"
cd "$APP_DIR/admin"
docker run --rm \
  -v "$PWD":/app \
  -w /app \
  node:22-bookworm-slim \
  sh -lc 'npm ci && npm run build'

echo "==> Выкладываю admin PWA"
sudo rm -rf /opt/swa6/admin/dist
sudo mkdir -p /opt/swa6/admin/dist
sudo cp -a dist/. /opt/swa6/admin/dist/
sudo chmod -R a+rX /opt/swa6/admin/dist
sudo systemctl reload caddy

echo
echo "===================================="
echo "ГОТОВО: настоящий Web Push включён"
echo "===================================="
echo "На iPhone:"
echo "1. Safari -> admin.swagystan.ru"
echo "2. Поделиться -> На экран Домой"
echo "3. Открыть приложение с иконки"
echo "4. Войти"
echo "5. Нажать УВЕД."
echo "6. Разрешить уведомления"
