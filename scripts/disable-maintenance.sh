#!/usr/bin/env bash
set -euo pipefail
[[ "$EUID" == 0 ]] || { echo "Запусти через sudo." >&2; exit 1; }
CADDYFILE="${CADDYFILE:-/etc/caddy/Caddyfile}"
SNIPPET=/etc/caddy/swagystan-maintenance.caddy
BACKUP=/root/swagystan-maintenance.Caddyfile.backup
TOKEN_FILE=/root/.swagystan-preview-token
WEBROOT=/var/www/swagystan-maintenance
[[ -f "$BACKUP" && -f "$SNIPPET" ]] || { echo "Режим ремонта не включён." >&2; exit 1; }
TEMP="$(mktemp)"
cp -a "$CADDYFILE" "$TEMP"
python3 - "$CADDYFILE" "$SNIPPET" <<'PY'
import sys
from pathlib import Path
p=Path(sys.argv[1]); needle="import "+sys.argv[2]
lines=p.read_text().splitlines(keepends=True)
out=[x for x in lines if needle not in x]
if len(out)==len(lines): raise SystemExit("Maintenance import не найден; конфиг не менял.")
p.write_text("".join(out))
PY
if ! caddy validate --config "$CADDYFILE" --adapter caddyfile || ! systemctl reload caddy; then
  cp -a "$TEMP" "$CADDYFILE"
  systemctl reload caddy || true
  rm -f "$TEMP"
  echo "Откатил конфигурацию: выключить ремонт не удалось." >&2
  exit 1
fi
rm -f "$TEMP" "$SNIPPET" "$TOKEN_FILE" "$BACKUP"
rm -rf "$WEBROOT"
echo "SWAGYSTAN: РЕМОНТ ВЫКЛЮЧЕН. Магазин снова открыт."
