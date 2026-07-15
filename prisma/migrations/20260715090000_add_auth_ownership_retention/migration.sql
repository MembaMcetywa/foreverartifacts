-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "authProvider" TEXT NOT NULL,
    "authSubject" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "emailVerifiedAt" DATETIME,
    "lastSeenAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deletedAt" DATETIME
);

-- Backfill owner for existing local development rows.
INSERT INTO "User" (
    "id",
    "authProvider",
    "authSubject",
    "email",
    "emailVerifiedAt",
    "lastSeenAt"
) VALUES (
    'dev_owner',
    'development',
    'dev-owner',
    'dev-owner@foreverartifacts.local',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;

CREATE TABLE "new_Asset" (
    "id" TEXT NOT NULL PRIMARY KEY,
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
    "processingStartedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastActivityAt" DATETIME,
    "expiresAt" DATETIME,
    "deletedAt" DATETIME,
    CONSTRAINT "Asset_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

INSERT INTO "new_Asset" (
    "id",
    "userId",
    "key",
    "contentType",
    "status",
    "printKey",
    "previewKey",
    "width",
    "height",
    "fileSize",
    "failureReason",
    "processingStartedAt",
    "createdAt",
    "lastActivityAt"
)
SELECT
    "id",
    'dev_owner',
    "key",
    "contentType",
    "status",
    "printKey",
    "previewKey",
    "width",
    "height",
    "fileSize",
    "failureReason",
    "processingStartedAt",
    "createdAt",
    "createdAt"
FROM "Asset";

DROP TABLE "Asset";
ALTER TABLE "new_Asset" RENAME TO "Asset";

CREATE TABLE "new_Album" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "albumName" TEXT NOT NULL,
    "albumSpecId" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "workflowStage" TEXT NOT NULL DEFAULT 'collect_photos',
    "activeSpreadPosition" INTEGER,
    "renderStatus" TEXT NOT NULL DEFAULT 'not_started',
    "renderId" TEXT,
    "renderArtifactKey" TEXT,
    "renderCompletedAt" DATETIME,
    "renderApprovedAt" DATETIME,
    "renderExpiresAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "lastActivityAt" DATETIME,
    "expiresAt" DATETIME,
    "deletionRequestedAt" DATETIME,
    "deletionCompletedAt" DATETIME,
    "deletedAt" DATETIME,
    CONSTRAINT "Album_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

INSERT INTO "new_Album" (
    "id",
    "userId",
    "albumName",
    "albumSpecId",
    "state",
    "workflowStage",
    "activeSpreadPosition",
    "renderStatus",
    "renderId",
    "renderArtifactKey",
    "renderCompletedAt",
    "renderApprovedAt",
    "createdAt",
    "updatedAt",
    "lastActivityAt"
)
SELECT
    "id",
    'dev_owner',
    "albumName",
    "albumSpecId",
    "state",
    "workflowStage",
    "activeSpreadPosition",
    "renderStatus",
    "renderId",
    "renderArtifactKey",
    "renderCompletedAt",
    "renderApprovedAt",
    "createdAt",
    "updatedAt",
    "updatedAt"
FROM "Album";

DROP TABLE "Album";
ALTER TABLE "new_Album" RENAME TO "Album";

PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

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
