-- Human-friendly sequential order numbers for the standalone admin PWA.
-- Existing orders are numbered chronologically; future orders use the same sequence.

CREATE SEQUENCE "Order_number_seq";

ALTER TABLE "Order"
ADD COLUMN "number" INTEGER;

WITH ranked AS (
  SELECT
    "id",
    ROW_NUMBER() OVER (
      ORDER BY "createdAt" ASC, "id" ASC
    )::INTEGER AS "number"
  FROM "Order"
)
UPDATE "Order" AS target
SET "number" = ranked."number"
FROM ranked
WHERE target."id" = ranked."id";

ALTER SEQUENCE "Order_number_seq"
OWNED BY "Order"."number";

ALTER TABLE "Order"
ALTER COLUMN "number"
SET DEFAULT nextval('"Order_number_seq"');

SELECT setval(
  '"Order_number_seq"',
  COALESCE(
    (SELECT MAX("number") FROM "Order"),
    0
  ) + 1,
  false
);

ALTER TABLE "Order"
ALTER COLUMN "number"
SET NOT NULL;

CREATE UNIQUE INDEX "Order_number_key"
ON "Order"("number");
