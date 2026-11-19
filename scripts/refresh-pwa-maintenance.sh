#!/usr/bin/env bash
set -euo pipefail
# Only replicate public PWA artwork/metadata into the separate maintenance root.
# Keep all storefront routes and the existing preview authentication unchanged.
SITE=/var/www/swagystan
PUBLIC=/var/www/swagystan-maintenance
CONF=/etc/caddy/swagystan-maintenance.caddy
[[ -f "$CONF" ]] || exit 0
DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
for f in manifest.webmanifest swag-pwa-180.png swag-pwa-192.png swag-pwa-512.png apple-touch-icon.png sw.js; do
  install -m 644 "$SITE/$f" "$PUBLIC/$f"
done
if ! grep -Fq '@maintenance_html not path ' "$CONF"; then
  BACKUP=$(mktemp)
  trap 'rm -f "$BACKUP"' EXIT
  cp "$CONF" "$BACKUP"
  python3 - "$CONF" <<'PY'
import sys
from pathlib import Path
p = Path(sys.argv[1])
s = p.read_text()
old = '  rewrite * /index.html'
if s.count(old) != 1:
    raise SystemExit('Unexpected maintenance rewrite; stopped')
p.write_text(s.replace(old, '''  @maintenance_html not path /manifest.webmanifest /swag-pwa-180.png /swag-pwa-192.png /swag-pwa-512.png /apple-touch-icon.png /sw.js
  rewrite @maintenance_html /index.html''', 1))
PY
  if ! caddy validate --config /etc/caddy/Caddyfile --adapter caddyfile >/dev/null 2>&1 || ! systemctl reload caddy; then
    cat "$BACKUP" > "$CONF"
    systemctl reload caddy || true
    echo "Maintenance PWA update failed; previous config restored." >&2
    exit 1
  fi
fi
install -m 644 "$DIR/../deploy/maintenance/index.html" "$PUBLIC/index.html"
echo 'Public PWA artwork updated; maintenance remains on.'
