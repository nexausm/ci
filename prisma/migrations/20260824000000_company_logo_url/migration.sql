-- AlterTable
ALTER TABLE "CompanyProfile" DROP COLUMN "logoDataUri";
ALTER TABLE "CompanyProfile"
ADD COLUMN "logoUrl" TEXT;