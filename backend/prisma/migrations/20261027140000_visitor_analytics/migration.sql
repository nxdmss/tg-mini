-- First-party, pseudonymous visitor sessions; no IP addresses or fingerprints.
CREATE TABLE "Visitor" (
    "id" TEXT NOT NULL,
    "firstSeen" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastSeen" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastPath" TEXT NOT NULL DEFAULT '/',
    "visitCount" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "Visitor_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "VisitorVisit" (
    "id" TEXT NOT NULL,
    "visitorId" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastSeen" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "path" TEXT NOT NULL DEFAULT '/',
    CONSTRAINT "VisitorVisit_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "Visitor_lastSeen_idx" ON "Visitor"("lastSeen");
CREATE INDEX "Visitor_firstSeen_idx" ON "Visitor"("firstSeen");
CREATE INDEX "VisitorVisit_visitorId_startedAt_idx" ON "VisitorVisit"("visitorId", "startedAt");
ALTER TABLE "VisitorVisit" ADD CONSTRAINT "VisitorVisit_visitorId_fkey" FOREIGN KEY ("visitorId") REFERENCES "Visitor"("id") ON DELETE CASCADE ON UPDATE CASCADE;
