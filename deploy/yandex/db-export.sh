#!/usr/bin/env bash
set -euo pipefail

: "${SOURCE_DATABASE_URL:?Set SOURCE_DATABASE_URL}"

OUT="${1:-tgmini.dump}"

pg_dump \
  --dbname="$SOURCE_DATABASE_URL" \
  --format=custom \
  --no-owner \
  --no-acl \
  --file="$OUT"

echo "Database dump created: $OUT"
