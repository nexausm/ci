import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { sanitizeInvoice } from "@/lib/defaults";
import type { InvoiceData } from "@/lib/types";

interface InvoiceDoc extends InvoiceData {
  _id: string;
}

export async function GET() {
  const db = await getDb();
  const docs = await db.collection<InvoiceDoc>("invoices").find().toArray();
  const invoices = docs.map(({ _id, ...invoice }) => invoice);
  return NextResponse.json(invoices);
}

export async function POST(req: Request) {
  const body = await req.json();
  const invoice = sanitizeInvoice(body);
  const db = await getDb();
  await db
    .collection<InvoiceDoc>("invoices")
    .replaceOne({ _id: invoice.id }, invoice, { upsert: true });
  return NextResponse.json(invoice);
}
