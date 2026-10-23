$ErrorActionPreference = "Stop"

function Replace-Text {
    param(
        [string]$Path,
        [string]$Old,
        [string]$New
    )

    if (!(Test-Path $Path)) {
        throw "Не найден файл: $Path"
    }

    $Text = Get-Content -Raw -Encoding UTF8 $Path

    if (-not $Text.Contains($Old)) {
        throw "Не найден ожидаемый фрагмент в $Path. Возможно, файл уже изменён."
    }

    $Text = $Text.Replace($Old, $New)
    [System.IO.File]::WriteAllText(
        (Resolve-Path $Path),
        $Text,
        [System.Text.UTF8Encoding]::new($false)
    )

    Write-Host "OK: $Path"
}

Replace-Text `
    "frontend/index.html" `
    @'
    <meta property="og:site_name" content="SWAGYSTAN" />
    <meta property="og:title" content="SWAGYSTAN" />
    <meta property="og:url" content="https://swagystan.ru/" />
    <title>SWAGYSTAN</title>
'@ `
    @'
    <meta name="application-name" content="SWAGYSTAN" />
    <meta name="description" content="SWAGYSTAN" />
    <meta property="og:site_name" content="SWAGYSTAN" />
    <meta property="og:title" content="SWAGYSTAN" />
    <meta property="og:description" content="SWAGYSTAN" />
    <meta property="og:url" content="https://swagystan.ru/" />
    <meta name="twitter:title" content="SWAGYSTAN" />
    <meta name="twitter:description" content="SWAGYSTAN" />
    <title>SWAGYSTAN</title>
    <script type="application/ld+json">
      {
        "@context": "https://schema.org",
        "@type": "WebSite",
        "url": "https://swagystan.ru/",
        "name": "SWAGYSTAN",
        "alternateName": "SWAGYSTAN"
      }
    </script>
'@

Replace-Text `
    "frontend/src/components/Header.tsx" `
    '          aria-label="SWA6Y5TAN"' `
    '          aria-label="SWAGYSTAN"'

Replace-Text `
    "frontend/src/components/Header.tsx" `
    '              alt="SWA6Y5TAN"' `
    '              alt="SWAGYSTAN"'

Replace-Text `
    "frontend/src/App.tsx" `
    '              {isShopView && shop ? shop.name : "SWA6Y5TAN"}' `
    '              {isShopView && shop ? shop.name : "SWAGYSTAN"}'

Write-Host ""
Write-Host "ГОТОВО. Усиление title для Google применено."
