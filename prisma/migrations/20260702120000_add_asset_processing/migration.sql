ALTER TABLE "Asset" ADD COLUMN "status" TEXT NOT NULL DEFAULT 'pending';
ALTER TABLE "Asset" ADD COLUMN "printKey" TEXT;
ALTER TABLE "Asset" ADD COLUMN "previewKey" TEXT;
ALTER TABLE "Asset" ADD COLUMN "width" INTEGER;
ALTER TABLE "Asset" ADD COLUMN "height" INTEGER;
ALTER TABLE "Asset" ADD COLUMN "fileSize" INTEGER;
ALTER TABLE "Asset" ADD COLUMN "failureReason" TEXT;
ALTER TABLE "Asset" ADD COLUMN "processingStartedAt" DATETIME;

UPDATE "Asset" SET "status" = 'ready';

CREATE UNIQUE INDEX "Asset_printKey_key" ON "Asset"("printKey");
CREATE UNIQUE INDEX "Asset_previewKey_key" ON "Asset"("previewKey");
