/*
  Warnings:

  - You are about to drop the column `createdById` on the `FieldTask` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "FieldTask" DROP CONSTRAINT "FieldTask_assigneeId_fkey";

-- DropForeignKey
ALTER TABLE "FieldTask" DROP CONSTRAINT "FieldTask_createdById_fkey";

-- AlterTable
ALTER TABLE "FieldTask" DROP COLUMN "createdById",
ADD COLUMN     "createdBy" TEXT;

-- AddForeignKey
ALTER TABLE "FieldTask" ADD CONSTRAINT "FieldTask_assigneeId_fkey" FOREIGN KEY ("assigneeId") REFERENCES "TeamMember"("id") ON DELETE SET NULL ON UPDATE CASCADE;
