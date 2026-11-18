#!/usr/bin/env bash
set -euo pipefail

WEBROOT="${SWAGYSTAN_WEBROOT:-/var/www/swagystan}"
LIVE_FILE="preview-7f3c9a2e6b1d4f80.html"
INDEX="$WEBROOT/index.html"
LIVE="$WEBROOT/$LIVE_FILE"

if [[ ! -s "$INDEX" ]]; then
  echo "Missing $INDEX; refusing to enable maintenance."
  exit 1
fi

if [[ ! -e "$LIVE" ]]; then
  sudo cp -a "$INDEX" "$LIVE"
fi

TMP=$(mktemp)
trap 'rm -f "$TMP"' EXIT
cat > "$TMP" <<'HTML'
<!doctype html>
<html lang="ru">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="theme-color" content="#fff">
  <title>SWAGYSTAN</title>
  <style>
    *{box-sizing:border-box}
    html,body{width:100%;height:100%;margin:0}
    body{display:grid;place-items:center;background:#fff;color:#111;font-family:Arial,Helvetica,sans-serif}
    main{text-align:center;padding:24px}
    h1{margin:0;font-size:clamp(42px,10vw,112px);font-weight:900;letter-spacing:-.085em;line-height:.9}
    p{margin:18px 0 0;font-size:clamp(16px,3vw,28px);font-weight:700;letter-spacing:.32em}
  </style>
</head>
<body>
  <main>
    <h1>SWAGYSTAN</h1>
    <p>РЕМОНТ</p>
  </main>
</body>
</html>
HTML
sudo install -m 0644 "$TMP" "$INDEX"
echo "MAINTENANCE ENABLED"
echo "Private preview: https://swagystan.ru/$LIVE_FILE"
