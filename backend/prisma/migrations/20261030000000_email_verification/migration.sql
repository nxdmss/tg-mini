ALTER TABLE "User" ADD COLUMN "emailVerifiedAt" TIMESTAMP(3), ADD COLUMN "sessionVersion" INTEGER NOT NULL DEFAULT 0;
CREATE TABLE "EmailChallenge" (
 "email" TEXT NOT NULL, "purpose" TEXT NOT NULL, "codeHash" TEXT NOT NULL,
 "passwordHash" TEXT, "name" TEXT, "expiresAt" TIMESTAMP(3) NOT NULL,
 "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "attempts" INTEGER NOT NULL DEFAULT 0,
 PRIMARY KEY ("email", "purpose")
);
