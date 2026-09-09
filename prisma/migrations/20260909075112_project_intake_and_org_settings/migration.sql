-- AlterTable
ALTER TABLE "Project" ADD COLUMN     "community" TEXT,
ADD COLUMN     "contractor" TEXT,
ADD COLUMN     "endDate" TEXT,
ADD COLUMN     "fundingSource" TEXT,
ADD COLUMN     "lga" TEXT,
ADD COLUMN     "owner" TEXT,
ADD COLUMN     "partner" TEXT,
ADD COLUMN     "startDate" TEXT;

-- CreateTable
CREATE TABLE "OrgSettings" (
    "id" TEXT NOT NULL DEFAULT 'org',
    "orgName" TEXT NOT NULL DEFAULT 'Seplat Energy Plc',
    "financialYear" TEXT NOT NULL DEFAULT 'FY 2026',
    "currencyLabel" TEXT NOT NULL DEFAULT '₦ Naira',
    "targetYear" INTEGER NOT NULL DEFAULT 2030,
    "dataStatusNote" TEXT NOT NULL DEFAULT 'Illustrative data — replace with verified Seplat figures before external reporting.',
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OrgSettings_pkey" PRIMARY KEY ("id")
);
