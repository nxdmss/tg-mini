#!/usr/bin/env bash
set -euo pipefail
TMP=$(mktemp -d)
trap 'rm -rf "$TMP"' EXIT
echo '==> Downloading latest SWAGYSTAN'
git clone -q --depth 1 --branch main https://github.com/nxdmss/tg-mini.git "$TMP/repo"
cd "$TMP/repo/frontend"
echo '==> Building frontend (production API)'
docker run --rm \
  -e VITE_API_URL=https://api.swagystan.ru \
  -e NPM_CONFIG_CACHE=/tmp/npm \
  -e HOME=/tmp \
  -u "$(id -u):$(id -g)" \
  -v "$PWD:/app" -w /app node:22-bookworm-slim \
  sh -c 'npm ci --no-audit --no-fund && npm run build'
test -s dist/index.html
echo '==> Publishing to Caddy webroot'
sudo cp -a dist/. /var/www/swagystan/
echo '==> Local deployed HTML asset:'
grep -oE '/assets/index-[^" ]+\.js' /var/www/swagystan/index.html | head -1 || true
echo '==> Site HTTP status:'
curl -skIL --max-time 10 https://swagystan.ru/ | head -5 || true
echo 'FRONTEND UPDATED'
