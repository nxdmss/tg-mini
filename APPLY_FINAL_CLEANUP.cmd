@echo off
setlocal
cd /d "%~dp0"

git rm -f --ignore-unmatch ^
  .DS_Store ^
  LAUNCH_CHECKLIST.md ^
  backend\prisma\seed.ts ^
  backend\src\auth\admin.guard.ts ^
  frontend\src\catalogSceneCache.ts ^
  frontend\src\piskaEgg.ts

echo.
echo Legacy files removed.
echo You can now run the builds.
echo.

del "%~f0"
