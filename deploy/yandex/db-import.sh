#!/usr/bin/env bash
set -euo pipefail

: "${TARGET_DATABASE_URL:?Set TARGET_DATABASE_URL}"

DUMP="${1:-tgmini.dump}"

pg_restore \
  --dbname="$TARGET_DATABASE_URL" \
  --no-owner \
  --no-acl \
  --clean \
  --if-exists \
  "$DUMP"

echo "Database restored from: $DUMP"
