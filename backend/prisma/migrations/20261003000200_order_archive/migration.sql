-- AlterTable
ALTER TABLE "Order" ADD COLUMN "archivedAt" TIMESTAMP(3);

-- Existing cancelled orders belong in the archive.
UPDATE "Order"
SET "archivedAt" = COALESCE("createdAt", CURRENT_TIMESTAMP)
WHERE "status" = 'CANCELLED';

-- CreateIndex
CREATE INDEX "Order_archivedAt_idx" ON "Order"("archivedAt");
