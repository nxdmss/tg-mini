from pathlib import Path

ROOT = Path(__file__).resolve().parent

def replace(path: str, old: str, new: str):
    p = ROOT / path
    if not p.exists():
        raise SystemExit(f"Не найден файл: {path}")
    text = p.read_text(encoding="utf-8")
    if old not in text:
        raise SystemExit(f"Не найден ожидаемый фрагмент в {path}. Возможно, файл уже изменён.")
    p.write_text(text.replace(old, new, 1), encoding="utf-8")
    print("OK:", path)

replace(
    "frontend/index.html",
    '    <meta property="og:site_name" content="SWAGYSTAN" />\n'
    '    <meta property="og:title" content="SWAGYSTAN" />\n'
    '    <meta property="og:url" content="https://swagystan.ru/" />\n'
    '    <title>SWAGYSTAN</title>',
    '    <meta name="application-name" content="SWAGYSTAN" />\n'
    '    <meta name="description" content="SWAGYSTAN" />\n'
    '    <meta property="og:site_name" content="SWAGYSTAN" />\n'
    '    <meta property="og:title" content="SWAGYSTAN" />\n'
    '    <meta property="og:description" content="SWAGYSTAN" />\n'
    '    <meta property="og:url" content="https://swagystan.ru/" />\n'
    '    <meta name="twitter:title" content="SWAGYSTAN" />\n'
    '    <meta name="twitter:description" content="SWAGYSTAN" />\n'
    '    <title>SWAGYSTAN</title>\n'
    '    <script type="application/ld+json">\n'
    '      {\n'
    '        "@context": "https://schema.org",\n'
    '        "@type": "WebSite",\n'
    '        "url": "https://swagystan.ru/",\n'
    '        "name": "SWAGYSTAN",\n'
    '        "alternateName": "SWAGYSTAN"\n'
    '      }\n'
    '    </script>',
)

replace(
    "frontend/src/components/Header.tsx",
    '          aria-label="SWA6Y5TAN"',
    '          aria-label="SWAGYSTAN"',
)

replace(
    "frontend/src/components/Header.tsx",
    '              alt="SWA6Y5TAN"',
    '              alt="SWAGYSTAN"',
)

replace(
    "frontend/src/App.tsx",
    '              {isShopView && shop ? shop.name : "SWA6Y5TAN"}',
    '              {isShopView && shop ? shop.name : "SWAGYSTAN"}',
)

print()
print("ГОТОВО. Усиление title для Google применено.")
