#!/usr/bin/env bash
set -euo pipefail
cd /opt/swa6/app
git fetch origin main
DIGITS_TMP=$(mktemp -d)
trap 'rm -rf "$DIGITS_TMP"' EXIT
git archive origin/main frontend/public/fonts/IZLOM_Narrow-Heavy.ttf frontend/public/typography-numbers-v3.css | tar -x -C "$DIGITS_TMP"
sudo mkdir -p /var/www/swagystan/fonts
sudo cp "$DIGITS_TMP/frontend/public/fonts/IZLOM_Narrow-Heavy.ttf" /var/www/swagystan/fonts/
sudo cp "$DIGITS_TMP/frontend/public/typography-numbers-v3.css" /var/www/swagystan/
sudo cp -a /var/www/swagystan/index.html "/var/www/swagystan/index.html.before-digits-$(date +%s)"
sudo python3 - <<'PY'
from pathlib import Path
p=Path('/var/www/swagystan/index.html')
s=p.read_text().replace("/typography-numbers-v2.css", "/typography-numbers-v3.css")
link='<link rel="stylesheet" href="/typography-numbers-v3.css" />'
if '/typography-numbers-v3.css' not in s:
    if '</head>' not in s: raise SystemExit('Missing HTML head; stopped')
    s=s.replace('</head>',link+'\n</head>')
p.write_text(s)
PY
echo 'ЦИФРЫ ОБНОВЛЕНЫ'
