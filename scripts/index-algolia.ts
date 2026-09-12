import { PrismaClient } from "../generated/prisma-node/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { sanitizeClient, sanitizeProduct } from "../lib/defaults";
import {
  clientRecord,
  configureIndex,
  invoiceRecord,
  pageRecords,
  productRecord,
  replaceAll,
} from "../lib/search";

const APP_ID = process.env.ALGOLIA_APP_ID;
const ADMIN_API_KEY = process.env.ALGOLIA_ADMIN_API_KEY;
const INDEX_NAME = process.env.ALGOLIA_INDEX_NAME;

async function main() {
  if (!APP_ID || !ADMIN_API_KEY || !INDEX_NAME) {
    console.error(
      "[index-algolia] missing env: set ALGOLIA_APP_ID, ALGOLIA_ADMIN_API_KEY and ALGOLIA_INDEX_NAME in .env",
    );
    process.exit(1);
  }

  const prisma = new PrismaClient({
    adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }),
  });

  const [invoices, clients, products] = await Promise.all([
    prisma.invoice.findMany({
      select: { id: true, invoiceNumber: true, billToName: true },
      orderBy: { createdAt: "asc" },
    }),
    prisma.client.findMany({ orderBy: { createdAt: "asc" } }),
    prisma.product.findMany({ orderBy: { createdAt: "asc" } }),
  ]);

  const records = [
    ...invoices.map(invoiceRecord),
    ...clients.map((c) => clientRecord(sanitizeClient(c))),
    ...products.map((p) => productRecord(sanitizeProduct(p))),
    ...pageRecords(),
  ];

  await configureIndex();
  const count = await replaceAll(records);

  await prisma.$disconnect();
  console.log(`Indexed ${count} records into "${INDEX_NAME}".`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
