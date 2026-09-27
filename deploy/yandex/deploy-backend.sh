#!/usr/bin/env bash
set -euo pipefail

if [[ ! -f ../../backend/.env.production ]]; then
  echo "Missing backend/.env.production"
  exit 1
fi

if [[ ! -f .env ]]; then
  echo "Missing deploy/yandex/.env"
  exit 1
fi

docker compose \
  --env-file .env \
  -f docker-compose.prod.yml \
  up -d \
  --build \
  --remove-orphans

docker compose \
  --env-file .env \
  -f docker-compose.prod.yml \
  ps
