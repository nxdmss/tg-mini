#!/bin/bash
set -euo pipefail
D=/opt/swa6/docker-compose.yml
T=$(mktemp -d)
trap 'rm -rf "$T"' EXIT
git clone -q --depth 1 https://github.com/nxdmss/tg-mini.git "$T/repo"
R="$T/repo"
C=swa6-backend-1
P=swa6-postgres-1
S=$(docker inspect "$C" --format '{{index .Config.Labels "com.docker.compose.service"}}')
cd /opt/swa6
B=$(docker compose -f "$D" config --format json | python3 -c 'import json,sys; b=json.load(sys.stdin)["services"][sys.argv[1]]["build"]; print(b["context"] if isinstance(b,dict) else b)' "$S")
if [ -f "$B/src/main.ts" ]; then DST="$B"; elif [ -f "$B/backend/src/main.ts" ]; then DST="$B/backend"; else echo 'Unknown backend build context; stopped'; exit 1; fi
mkdir -p "$HOME/swagystan-backups"
NOW=$(date +%Y%m%d%H%M%S)
tar -czf "$HOME/swagystan-backups/backend-$NOW.tgz" -C "$DST" src prisma package.json package-lock.json
docker exec "$P" sh -c 'pg_dump -U "$POSTGRES_USER" "$POSTGRES_DB"' > "$HOME/swagystan-backups/db-$NOW.sql"
sudo cp -a "$R/backend/src/." "$DST/src/"
sudo cp -a "$R/backend/prisma/." "$DST/prisma/"
for f in package.json package-lock.json nest-cli.json tsconfig.json tsconfig.build.json; do [ ! -f "$R/backend/$f" ] || sudo cp "$R/backend/$f" "$DST/$f"; done
OLD=$(docker inspect "$C" --format '{{.Image}}')
IMAGE=$(docker inspect "$C" --format '{{.Config.Image}}')
docker compose -f "$D" build "$S"
docker run --rm -e VITE_API_URL=https://api.swagystan.ru -e HOME=/tmp -e NPM_CONFIG_CACHE=/tmp/npm -u "$(id -u):$(id -g)" -v "$R/frontend:/app" -w /app node:22-bookworm-slim sh -c 'npm ci && npm run build'
SQL="$R/backend/prisma/migrations/20261027140000_visitor_analytics/migration.sql"
[ -s "$R/frontend/dist/index.html" ] && [ -s "$SQL" ]
EXISTS=$(echo "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='public' AND table_name='Visitor';" | docker exec -i "$P" sh -c 'psql -At -U "$POSTGRES_USER" "$POSTGRES_DB"')
if [ "$EXISTS" = 0 ]; then docker exec -i "$P" sh -c 'psql -1 -v ON_ERROR_STOP=1 -U "$POSTGRES_USER" "$POSTGRES_DB"' < "$SQL"; fi
docker compose -f "$D" up -d --no-deps --force-recreate "$S"
for i in $(seq 1 15); do if curl -fsS --max-time 5 'http://127.0.0.1:3000/products?shop=swagystan' > /dev/null; then sudo cp -a "$R/frontend/dist/." /var/www/swagystan/; echo 'SWAGYSTAN UPDATED'; exit 0; fi; sleep 2; done
docker tag "$OLD" "$IMAGE"
docker compose -f "$D" up -d --no-deps --force-recreate "$S"
echo 'Backend rolled back; storefront unchanged' >&2
exit 1
