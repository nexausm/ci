-- CreateTable
CREATE TABLE "ExternalCost" (
    "id" TEXT NOT NULL,
    "invoiceId" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "vendor" TEXT NOT NULL DEFAULT '',
    "invoiceNumber" TEXT NOT NULL DEFAULT '',
    "billedDate" TEXT NOT NULL DEFAULT '',
    CONSTRAINT "ExternalCost_pkey" PRIMARY KEY ("id")
);
-- CreateIndex
CREATE INDEX "ExternalCost_invoiceId_idx" ON "ExternalCost"("invoiceId");
-- CreateIndex
CREATE UNIQUE INDEX "ExternalCost_invoiceId_itemId_key" ON "ExternalCost"("invoiceId", "itemId");
-- AddForeignKey
ALTER TABLE "ExternalCost"
ADD CONSTRAINT "ExternalCost_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "Invoice"("id") ON DELETE CASCADE ON UPDATE CASCADE;
-- Backfill: extract external costs from the items JSON into the ExternalCost table
INSERT INTO "ExternalCost" (
        "id",
        "invoiceId",
        "itemId",
        "vendor",
        "invoiceNumber",
        "billedDate"
    )
SELECT 'ec_' || "Invoice"."id" || '_' || (item->>'id'),
    "Invoice"."id",
    (item->>'id'),
    COALESCE(item->'externalCost'->>'vendor', ''),
    COALESCE(item->'externalCost'->>'invoiceNumber', ''),
    COALESCE(item->'externalCost'->>'billedDate', '')
FROM "Invoice",
    jsonb_array_elements("Invoice"."items") AS item
WHERE item->'externalCost' IS NOT NULL
    AND item->'externalCost' <> 'null'::jsonb;
-- Strip externalCost from the items JSON (now the single source of truth is ExternalCost)
UPDATE "Invoice"
SET "items" = (
        SELECT COALESCE(jsonb_agg(item - 'externalCost'), '[]'::jsonb)
        FROM jsonb_array_elements("Invoice"."items") AS item
    );