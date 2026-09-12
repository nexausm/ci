import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sanitizeClient, sanitizeProduct } from "@/lib/defaults";
import {
  clientRecord,
  configureIndex,
  invoiceRecord,
  pageRecords,
  productRecord,
  replaceAll,
} from "@/lib/search";

export async function POST() {
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
  return NextResponse.json({ ok: true, indexed: count });
}

export const GET = POST;
