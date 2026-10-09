-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('OWNER', 'ADMIN', 'EDITOR', 'VIEWER');

-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('INVITED', 'ACTIVE');

-- AlterTable
ALTER TABLE "Branding" ADD COLUMN     "showLogo" BOOLEAN NOT NULL DEFAULT true,
ALTER COLUMN "layout" SET DEFAULT 'contemporary';

-- AlterTable
ALTER TABLE "Organization" ADD COLUMN     "fiscalYearEndDay" INTEGER NOT NULL DEFAULT 31,
ADD COLUMN     "fiscalYearEndMonth" INTEGER NOT NULL DEFAULT 12,
ADD COLUMN     "plan" TEXT NOT NULL DEFAULT 'STARTER';

-- The fiscal year now ends on a month/day; it ends the day before the old start month.
UPDATE "Organization" SET
  "fiscalYearEndMonth" = CASE WHEN "fiscalYearStartMonth" = 1 THEN 12 ELSE "fiscalYearStartMonth" - 1 END,
  "fiscalYearEndDay" = EXTRACT(DAY FROM (make_date(2001, CASE WHEN "fiscalYearStartMonth" = 1 THEN 12 ELSE "fiscalYearStartMonth" - 1 END, 1) + INTERVAL '1 month' - INTERVAL '1 day'))::int;

ALTER TABLE "Organization" DROP COLUMN "fiscalYearStartMonth";

-- AlterTable
ALTER TABLE "Tax" ADD COLUMN     "abbreviation" TEXT,
ADD COLUMN     "description" TEXT,
ADD COLUMN     "isRecoverable" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "showTaxNumber" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "taxNumber" TEXT;

UPDATE "Tax" SET "abbreviation" = "name";
ALTER TABLE "Tax" ALTER COLUMN "abbreviation" SET NOT NULL;

-- CreateTable
CREATE TABLE "OrgUser" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "name" TEXT,
    "email" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'EDITOR',
    "canSendInvoices" BOOLEAN NOT NULL DEFAULT false,
    "status" "UserStatus" NOT NULL DEFAULT 'INVITED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OrgUser_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "OrgUser_organizationId_email_key" ON "OrgUser"("organizationId", "email");

-- AddForeignKey
ALTER TABLE "OrgUser" ADD CONSTRAINT "OrgUser_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

