@echo off
setlocal
cd /d "%~dp0"

where node >nul 2>&1
if errorlevel 1 (
  echo ERROR: Node.js not found.
  echo Run this patch on the same computer where you build the frontend.
  pause
  exit /b 1
)

node apply-zulfia-patch.mjs
if errorlevel 1 (
  echo.
  echo Patch failed.
  pause
  exit /b 1
)

echo.
echo Done. Now run:
echo cd frontend
echo npm run build
echo.
pause
