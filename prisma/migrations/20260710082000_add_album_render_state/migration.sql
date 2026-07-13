ALTER TABLE "Album" ADD COLUMN "renderStatus" TEXT NOT NULL DEFAULT 'not_started';
ALTER TABLE "Album" ADD COLUMN "renderId" TEXT;
ALTER TABLE "Album" ADD COLUMN "renderArtifactKey" TEXT;
ALTER TABLE "Album" ADD COLUMN "renderCompletedAt" DATETIME;
ALTER TABLE "Album" ADD COLUMN "renderApprovedAt" DATETIME;
