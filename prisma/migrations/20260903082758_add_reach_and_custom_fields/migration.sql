-- AlterTable
ALTER TABLE "ProjectImpact" ADD COLUMN     "reach" JSONB;

-- CreateTable
CREATE TABLE "CustomField" (
    "id" TEXT NOT NULL,
    "projectCode" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "answer" TEXT NOT NULL,
    "format" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "updatedBy" TEXT NOT NULL,
    "updatedAt" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CustomField_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CustomField_projectCode_idx" ON "CustomField"("projectCode");

-- AddForeignKey
ALTER TABLE "CustomField" ADD CONSTRAINT "CustomField_projectCode_fkey" FOREIGN KEY ("projectCode") REFERENCES "Project"("code") ON DELETE CASCADE ON UPDATE CASCADE;
