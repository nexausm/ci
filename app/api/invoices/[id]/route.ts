import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import type { InvoiceData } from "@/lib/types";

interface InvoiceDoc extends InvoiceData {
  _id: string;
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const db = await getDb();
  const doc = await db.collection<InvoiceDoc>("invoices").findOne({ _id: id });
  if (!doc) return NextResponse.json(null, { status: 404 });
  const { _id, ...invoice } = doc;
  return NextResponse.json(invoice);
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const db = await getDb();
  await db.collection<InvoiceDoc>("invoices").deleteOne({ _id: id });
  return NextResponse.json({ ok: true });
}
