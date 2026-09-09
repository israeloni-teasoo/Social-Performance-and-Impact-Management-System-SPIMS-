-- CreateTable
CREATE TABLE "MentionSource" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "target" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MentionSource_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Mention" (
    "id" TEXT NOT NULL,
    "sourceId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "publisher" TEXT NOT NULL,
    "snippet" TEXT NOT NULL DEFAULT '',
    "language" TEXT NOT NULL DEFAULT '',
    "country" TEXT NOT NULL DEFAULT '',
    "publishedAt" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'pending',
    "category" TEXT,
    "projectCode" TEXT,
    "reviewedBy" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Mention_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MentionRun" (
    "id" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" TEXT NOT NULL,
    "detail" JSONB NOT NULL,
    "found" INTEGER NOT NULL DEFAULT 0,
    "added" INTEGER NOT NULL DEFAULT 0,
    "duplicates" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "MentionRun_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "MentionSource_kind_target_key" ON "MentionSource"("kind", "target");

-- CreateIndex
CREATE UNIQUE INDEX "Mention_url_key" ON "Mention"("url");

-- CreateIndex
CREATE INDEX "Mention_status_idx" ON "Mention"("status");

-- CreateIndex
CREATE INDEX "Mention_projectCode_idx" ON "Mention"("projectCode");

-- CreateIndex
CREATE INDEX "Mention_publishedAt_idx" ON "Mention"("publishedAt");

-- AddForeignKey
ALTER TABLE "Mention" ADD CONSTRAINT "Mention_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "MentionSource"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Mention" ADD CONSTRAINT "Mention_projectCode_fkey" FOREIGN KEY ("projectCode") REFERENCES "Project"("code") ON DELETE SET NULL ON UPDATE CASCADE;
