SWAGYSTAN V2 — FOR YOU / STORES

Replace only these files/folders in project root:
frontend/src/App.tsx
frontend/src/components/Header.tsx
frontend/src/components/Header.css
frontend/src/components/StoreTabs.tsx
frontend/src/components/StoreDirectory.tsx
frontend/src/components/StoreExperience.css

NEW UX:
- / = "Для вас": all products mixed together.
- /stores = big store tiles.
- /shop/:slug = products from selected store.
- Logo: left on For You, smoothly moves to center on Stores, returns left after store selection.
- Top tabs behave like TikTok-style section switcher.

Mac install:
1. Unzip this archive into your tg-mini project root.
2. Allow replacement of existing files.
3. New files will be added automatically.
4. Run:
   cd frontend
   npm run build
   npm run dev -- --host 0.0.0.0
