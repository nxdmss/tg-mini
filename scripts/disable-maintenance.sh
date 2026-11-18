#!/usr/bin/env bash
set -euo pipefail
WEBROOT="${SWAGYSTAN_WEBROOT:-/var/www/swagystan}"
LIVE="$WEBROOT/preview-7f3c9a2e6b1d4f80.html"
if [[ ! -s "$LIVE" ]]; then
  echo "Private preview file not found; refusing to replace the maintenance page."
  exit 1
fi
sudo cp -a "$LIVE" "$WEBROOT/index.html"
echo "MAINTENANCE DISABLED"
