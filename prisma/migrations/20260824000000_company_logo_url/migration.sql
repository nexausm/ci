-- AlterTable: move the stored logo into the new column before dropping the
-- legacy one so existing logos are preserved (data-URI strings still render
-- via <img src>).
ALTER TABLE "CompanyProfile"
ADD COLUMN "logoUrl" TEXT;
UPDATE "CompanyProfile"
SET "logoUrl" = "logoDataUri"
WHERE "logoDataUri" IS NOT NULL
    AND "logoDataUri" <> '';
ALTER TABLE "CompanyProfile" DROP COLUMN "logoDataUri";