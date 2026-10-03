#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
TARGET_DIR="${ADMIN_TARGET_DIR:-/opt/swa6/admin/dist}"

cd "$ROOT_DIR/admin"

npm ci
npm run build

sudo install -d -m 0755 "$TARGET_DIR"
sudo rsync -a --delete dist/ "$TARGET_DIR/"
sudo find "$TARGET_DIR" -type d -exec chmod 0755 {} \;
sudo find "$TARGET_DIR" -type f -exec chmod 0644 {} \;

echo "Admin PWA deployed to $TARGET_DIR"
