import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sanitizeInvoice } from "@/lib/defaults";
import {
  itemsFromJson,
  inflateExternalCosts,
  toPayment,
} from "@/controllers/invoices";
import { invoicePdfResponse } from "@/lib/invoice-pdf";

export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const doc = await prisma.invoice.findUnique({
    where: { id },
    include: { payments: true, externalCosts: true },
  });
  if (!doc) return new NextResponse("Not found", { status: 404 });

  const { payments, externalCosts, ...stored } = doc;
  const data = sanitizeInvoice({
    ...stored,
    id: stored.id,
    items: inflateExternalCosts(itemsFromJson(stored.items), externalCosts),
    payments: payments.map(toPayment),
  });

  return invoicePdfResponse(data);
}
