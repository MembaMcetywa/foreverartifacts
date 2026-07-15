ALTER TABLE "Album" ADD COLUMN "workflowStage" TEXT NOT NULL DEFAULT 'collect_photos';
ALTER TABLE "Album" ADD COLUMN "activeSpreadPosition" INTEGER;
