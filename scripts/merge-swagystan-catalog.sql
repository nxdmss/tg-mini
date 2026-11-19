-- Run using psql -1 -v ON_ERROR_STOP=1 after backing up production.
-- Existing IDs, images, sizes, cart and order relations remain untouched.
LOCK TABLE "Shop" IN SHARE ROW EXCLUSIVE MODE;
LOCK TABLE "Product" IN SHARE ROW EXCLUSIVE MODE;
DO $$
DECLARE
  target_id text;
  moved_count bigint;
BEGIN
  SELECT "id" INTO target_id FROM "Shop" WHERE "slug" = 'swagystan';
  IF target_id IS NULL THEN
    RAISE EXCEPTION 'SWAGYSTAN shop missing; no catalog changes applied';
  END IF;
  UPDATE "Shop" SET "isActive" = true, "deletedAt" = NULL, "updatedAt" = CURRENT_TIMESTAMP
    WHERE "id" = target_id AND ("isActive" = false OR "deletedAt" IS NOT NULL);
  UPDATE "Product" SET "shopId" = target_id
    WHERE "deletedAt" IS NULL AND "shopId" IS DISTINCT FROM target_id;
  GET DIAGNOSTICS moved_count = ROW_COUNT;
  UPDATE "Shop" SET "isActive" = false, "updatedAt" = CURRENT_TIMESTAMP
    WHERE "id" <> target_id AND "isActive" = true;
  IF EXISTS (SELECT 1 FROM "Product" WHERE "deletedAt" IS NULL AND "shopId" IS DISTINCT FROM target_id) THEN
    RAISE EXCEPTION 'Catalog consolidation verification failed';
  END IF;
  RAISE NOTICE 'SWAGYSTAN: % products consolidated; no product records removed', moved_count;
END $$;
