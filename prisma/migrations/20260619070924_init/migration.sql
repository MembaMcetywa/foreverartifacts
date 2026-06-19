-- CreateTable
CREATE TABLE "Asset" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "key" TEXT NOT NULL,
    "contentType" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Album" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "albumSpecId" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "AlbumSpread" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "albumId" TEXT NOT NULL,
    "templateId" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    CONSTRAINT "AlbumSpread_albumId_fkey" FOREIGN KEY ("albumId") REFERENCES "Album" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AlbumSlot" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "spreadId" TEXT NOT NULL,
    "slotIndex" INTEGER NOT NULL,
    "assetId" TEXT NOT NULL,
    CONSTRAINT "AlbumSlot_spreadId_fkey" FOREIGN KEY ("spreadId") REFERENCES "AlbumSpread" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "AlbumSlot_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "Asset" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Asset_key_key" ON "Asset"("key");
