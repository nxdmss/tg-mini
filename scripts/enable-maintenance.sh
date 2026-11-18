#!/usr/bin/env bash
set -euo pipefail
[[ "$EUID" == 0 ]] || { echo "Run with sudo." >&2; exit 1; }
CADDYFILE="${CADDYFILE:-/etc/caddy/Caddyfile}"
SNIPPET=/etc/caddy/swagystan-maintenance.caddy
BACKUP=/root/swagystan-maintenance.Caddyfile.backup
TOKEN_FILE=/root/.swagystan-preview-token
WEBROOT=/var/www/swagystan-maintenance
SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
PAGE="$SCRIPT_DIR/../deploy/maintenance/index.html"
systemctl is-active --quiet caddy || { echo "Caddy is not active; no changes made." >&2; exit 1; }
[[ -s "$CADDYFILE" && -s /var/www/swagystan/index.html && -s "$PAGE" ]] || { echo "Caddyfile, production frontend, or maintenance page is missing." >&2; exit 1; }
if [[ -f "$BACKUP" && -f "$TOKEN_FILE" && -f "$SNIPPET" ]]; then
  echo "Maintenance mode is already enabled."
  echo "Private preview: https://swagystan.ru/?preview=$(cat "$TOKEN_FILE")"
  exit 0
fi
[[ ! -e "$BACKUP" && ! -e "$SNIPPET" && ! -e "$TOKEN_FILE" ]] || { echo "Partial previous setup found; stopping safely." >&2; exit 1; }
TOKEN="$(openssl rand -hex 32)"
install -d -m 755 "$WEBROOT"
install -m 644 "$PAGE" "$WEBROOT/index.html"
umask 077
printf '%s' "$TOKEN" > "$TOKEN_FILE"
cp -a "$CADDYFILE" "$BACKUP"
cat > "$SNIPPET" <<EOF
@swag_preview query preview ${TOKEN}
handle @swag_preview {
  header Set-Cookie "swagystan_preview=${TOKEN}; Domain=swagystan.ru; Path=/; Max-Age=604800; HttpOnly; Secure; SameSite=Lax"
  redir / 302
}
@swag_owner header Cookie *swagystan_preview=${TOKEN}*
handle @swag_owner {
  root * /var/www/swagystan
  try_files {path} /index.html
  file_server
}
handle {
  root * ${WEBROOT}
  rewrite * /index.html
  header Cache-Control "no-store, max-age=0"
  file_server
}
EOF
chmod 644 "$SNIPPET"
if ! python3 - "$CADDYFILE" "$SNIPPET" <<'PY'
import re, sys
from pathlib import Path
p = Path(sys.argv[1])
imp = "import " + sys.argv[2]
lines = p.read_text().splitlines(keepends=True)
pat = re.compile(r"^(?:www\.)?swagystan\.ru(?::\d+)?(?:\s*,\s*(?:www\.)?swagystan\.ru(?::\d+)?)*\s*\{\s*$")
positions = []
for i, line in enumerate(lines):
    if pat.fullmatch(line.strip()):
        positions.append(i + 1)
if not positions:
    raise SystemExit("No swagystan.ru Caddy site block found; no changes made.")
if any(imp in line for line in lines):
    raise SystemExit("Maintenance import already exists.")
for pos in reversed(positions):
    lines.insert(pos, "  " + imp + "\n")
p.write_text("".join(lines))
PY
then
  cp -a "$BACKUP" "$CADDYFILE"
  rm -f "$SNIPPET" "$TOKEN_FILE" "$BACKUP"
  rm -rf "$WEBROOT"
  echo "Could not locate site block; original Caddy config restored." >&2
  exit 1
fi
if ! caddy validate --config "$CADDYFILE" --adapter caddyfile; then
  cp -a "$BACKUP" "$CADDYFILE"
  rm -f "$SNIPPET" "$TOKEN_FILE" "$BACKUP"
  rm -rf "$WEBROOT"
  echo "Caddy validation failed; original config restored." >&2
  exit 1
fi
if ! systemctl reload caddy; then
  cp -a "$BACKUP" "$CADDYFILE"
  systemctl reload caddy || true
  rm -f "$SNIPPET" "$TOKEN_FILE" "$BACKUP"
  rm -rf "$WEBROOT"
  echo "Caddy reload failed; original config restored." >&2
  exit 1
fi
echo "SWAGYSTAN: REPAIR MODE ENABLED"
echo "Public page: https://swagystan.ru"
echo "Private preview link (do not share):"
echo "https://swagystan.ru/?preview=${TOKEN}"
echo "Disable: sudo bash scripts/disable-maintenance.sh"
