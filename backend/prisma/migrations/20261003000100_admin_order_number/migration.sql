-- Add human-friendly sequential order numbers for the admin PWA.
-- Existing rows receive sequence values automatically; new orders continue from there.
ALTER TABLE "Order"
ADD COLUMN "number" SERIAL NOT NULL;

CREATE UNIQUE INDEX "Order_number_key" ON "Order"("number");
