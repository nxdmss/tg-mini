#!/usr/bin/env bash
set -euo pipefail

: "${API_URL:?Set API_URL}"

base="${API_URL%/}"

curl --fail --silent --show-error "$base/" >/dev/null
curl --fail --silent --show-error "$base/products" >/dev/null
curl --fail --silent --show-error "$base/categories" >/dev/null
curl --fail --silent --show-error "$base/shops" >/dev/null

echo "API smoke test passed: $base"
