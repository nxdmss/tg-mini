#!/usr/bin/env bash
set -euo pipefail

: "${FRONTEND_BUCKET:?Set FRONTEND_BUCKET}"
: "${OBJECT_STORAGE_ACCESS_KEY_ID:?Set OBJECT_STORAGE_ACCESS_KEY_ID}"
: "${OBJECT_STORAGE_SECRET_ACCESS_KEY:?Set OBJECT_STORAGE_SECRET_ACCESS_KEY}"

export AWS_ACCESS_KEY_ID="$OBJECT_STORAGE_ACCESS_KEY_ID"
export AWS_SECRET_ACCESS_KEY="$OBJECT_STORAGE_SECRET_ACCESS_KEY"
export AWS_DEFAULT_REGION="${OBJECT_STORAGE_REGION:-ru-central1}"

pushd ../../frontend >/dev/null

npm ci
npm run build

aws \
  --endpoint-url https://storage.yandexcloud.net \
  s3 sync \
  dist/ \
  "s3://${FRONTEND_BUCKET}/" \
  --delete \
  --exclude "index.html" \
  --cache-control "public,max-age=31536000,immutable"

aws \
  --endpoint-url https://storage.yandexcloud.net \
  s3 cp \
  dist/index.html \
  "s3://${FRONTEND_BUCKET}/index.html" \
  --cache-control "no-cache,no-store,must-revalidate" \
  --content-type "text/html; charset=utf-8"

popd >/dev/null

echo "Frontend uploaded to s3://${FRONTEND_BUCKET}"
echo "Set bucket website index+error to index.html and place Cloud CDN in front."
