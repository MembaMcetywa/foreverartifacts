-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "authProvider" TEXT NOT NULL,
    "authSubject" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "emailVerifiedAt" TIMESTAMP(3),
    "lastSeenAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Asset" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "contentType" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "printKey" TEXT,
    "previewKey" TEXT,
    "width" INTEGER,
    "height" INTEGER,
    "fileSize" INTEGER,
    "failureReason" TEXT,
    "processingStartedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastActivityAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Asset_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Album" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "albumName" TEXT NOT NULL,
    "albumSpecId" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "workflowStage" TEXT NOT NULL DEFAULT 'collect_photos',
    "activeSpreadPosition" INTEGER,
    "renderStatus" TEXT NOT NULL DEFAULT 'not_started',
    "renderId" TEXT,
    "renderArtifactKey" TEXT,
    "renderCompletedAt" TIMESTAMP(3),
    "renderApprovedAt" TIMESTAMP(3),
    "renderExpiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "lastActivityAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "deletionRequestedAt" TIMESTAMP(3),
    "deletionCompletedAt" TIMESTAMP(3),
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Album_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AlbumAsset" (
    "id" TEXT NOT NULL,
    "albumId" TEXT NOT NULL,
    "assetId" TEXT NOT NULL,
    "order" INTEGER NOT NULL,

    CONSTRAINT "AlbumAsset_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AlbumSpread" (
    "id" TEXT NOT NULL,
    "albumId" TEXT NOT NULL,
    "templateId" TEXT NOT NULL,
    "order" INTEGER NOT NULL,

    CONSTRAINT "AlbumSpread_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AlbumSlot" (
    "id" TEXT NOT NULL,
    "spreadId" TEXT NOT NULL,
    "slotIndex" INTEGER NOT NULL,
    "assetId" TEXT NOT NULL,

    CONSTRAINT "AlbumSlot_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_authProvider_authSubject_key" ON "User"("authProvider", "authSubject");

-- CreateIndex
CREATE UNIQUE INDEX "Asset_key_key" ON "Asset"("key");

-- CreateIndex
CREATE UNIQUE INDEX "Asset_printKey_key" ON "Asset"("printKey");

-- CreateIndex
CREATE UNIQUE INDEX "Asset_previewKey_key" ON "Asset"("previewKey");

-- CreateIndex
CREATE INDEX "Asset_userId_idx" ON "Asset"("userId");

-- CreateIndex
CREATE INDEX "Album_userId_idx" ON "Album"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "AlbumAsset_albumId_assetId_key" ON "AlbumAsset"("albumId", "assetId");

-- CreateIndex
CREATE UNIQUE INDEX "AlbumAsset_albumId_order_key" ON "AlbumAsset"("albumId", "order");

-- CreateIndex
CREATE UNIQUE INDEX "AlbumSpread_albumId_order_key" ON "AlbumSpread"("albumId", "order");

-- CreateIndex
CREATE UNIQUE INDEX "AlbumSlot_spreadId_slotIndex_key" ON "AlbumSlot"("spreadId", "slotIndex");

-- AddForeignKey
ALTER TABLE "Asset" ADD CONSTRAINT "Asset_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Album" ADD CONSTRAINT "Album_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AlbumAsset" ADD CONSTRAINT "AlbumAsset_albumId_fkey" FOREIGN KEY ("albumId") REFERENCES "Album"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AlbumAsset" ADD CONSTRAINT "AlbumAsset_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "Asset"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AlbumSpread" ADD CONSTRAINT "AlbumSpread_albumId_fkey" FOREIGN KEY ("albumId") REFERENCES "Album"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AlbumSlot" ADD CONSTRAINT "AlbumSlot_spreadId_fkey" FOREIGN KEY ("spreadId") REFERENCES "AlbumSpread"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AlbumSlot" ADD CONSTRAINT "AlbumSlot_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "Asset"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
