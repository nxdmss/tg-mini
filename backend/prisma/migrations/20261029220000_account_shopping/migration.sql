CREATE TABLE "AccountCartItem" (
 "userId" TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
 "productId" TEXT NOT NULL, "size" TEXT NOT NULL, "quantity" INTEGER NOT NULL,
 PRIMARY KEY ("userId", "productId", "size")
);
CREATE TABLE "AccountFavorite" (
 "userId" TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
 "productId" TEXT NOT NULL, PRIMARY KEY ("userId", "productId")
);
