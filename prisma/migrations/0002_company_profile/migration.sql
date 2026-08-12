-- CreateTable
CREATE TABLE "CompanyProfile" (
    "id" TEXT NOT NULL DEFAULT 'default',
    "companyName" TEXT NOT NULL DEFAULT '',
    "numberLabel" TEXT NOT NULL DEFAULT '',
    "numberValue" TEXT NOT NULL DEFAULT '',
    "addressLines" TEXT [] DEFAULT ARRAY []::TEXT [],
    "phone" TEXT NOT NULL DEFAULT '',
    "email" TEXT NOT NULL DEFAULT '',
    "logoDataUri" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "CompanyProfile_pkey" PRIMARY KEY ("id")
);