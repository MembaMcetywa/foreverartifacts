/*
  Warnings:

  - Added the required column `albumName` to the `Album` table without a default value. This is not possible if the table is not empty.

*/
-- CreateTable
CREATE TABLE "AlbumAsset" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "albumId" TEXT NOT NULL,
    "assetId" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    CONSTRAINT "AlbumAsset_albumId_fkey" FOREIGN KEY ("albumId") REFERENCES "Album" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "AlbumAsset_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "Asset" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Album" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "albumName" TEXT NOT NULL,
    "albumSpecId" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Album" ("albumSpecId", "createdAt", "id", "state", "updatedAt") SELECT "albumSpecId", "createdAt", "id", "state", "updatedAt" FROM "Album";
DROP TABLE "Album";
ALTER TABLE "new_Album" RENAME TO "Album";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "AlbumAsset_albumId_assetId_key" ON "AlbumAsset"("albumId", "assetId");

-- CreateIndex
CREATE UNIQUE INDEX "AlbumAsset_albumId_order_key" ON "AlbumAsset"("albumId", "order");
