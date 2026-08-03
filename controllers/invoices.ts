import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { sanitizeInvoice } from "@/lib/defaults";
import { InvoiceModel } from "@/models/invoices";
import { PaymentModel } from "@/models/payments";
import type { Payment } from "@/models/payments";

const PATCH_FIELDS = [
  "invoiceNumber",
  "invoiceDate",
  "dueDate",
  "currency",
  "clientId",
  "billToType",
  "billToName",
  "billToContactName",
  "billToAddress",
  "billToPhone",
  "billToEmail",
  "items",
  "discountEnabled",
  "discountValue",
  "taxEnabled",
  "taxLabel",
  "taxValue",
  "notes",
  "state",
  "updatedAt",
] as const;

async function syncPayments(invoiceId: string, payments: Payment[]) {
  const incoming = payments.filter((p) => p.id);
  const incomingIds = new Set(incoming.map((p) => p.id));
  const existing = await PaymentModel.find({ invoiceId }).lean();
  for (const payment of incoming) {
    const { id: paymentId, ...rest } = payment;
    await PaymentModel.updateOne(
      { _id: paymentId },
      { $set: { ...rest, invoiceId } },
      { upsert: true },
    );
  }
  for (const old of existing) {
    if (!incomingIds.has(old._id)) {
      await PaymentModel.deleteOne({ _id: old._id });
    }
  }
}

export async function getInvoices() {
  await getDb();
  const docs = await InvoiceModel.find().lean();
  const paymentDocs = await PaymentModel.find().lean();
  const paymentsByInvoice = new Map<string, typeof paymentDocs>();
  for (const doc of paymentDocs) {
    if (!doc.invoiceId) continue;
    const list = paymentsByInvoice.get(doc.invoiceId) ?? [];
    list.push(doc);
    paymentsByInvoice.set(doc.invoiceId, list);
  }
  const invoices = docs.map(({ _id, ...invoice }) => {
    const payments = (paymentsByInvoice.get(_id) ?? []).map(
      ({ _id: paymentId, ...payment }) => ({ ...payment, id: paymentId }),
    );
    return { ...invoice, id: _id, payments };
  });
  return NextResponse.json(invoices);
}

export async function createInvoice(req: Request) {
  const body = await req.json();
  const invoice = sanitizeInvoice(body);
  await getDb();
  const { id, payments = [], ...data } = invoice;
  await InvoiceModel.updateOne(
    { _id: id },
    { $set: data },
    { upsert: true },
  );
  await syncPayments(id, payments);
  return NextResponse.json(invoice);
}

export async function updateInvoice(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const body = await req.json();
  const set: Record<string, unknown> = {};
  for (const key of PATCH_FIELDS) {
    if (body[key] !== undefined) set[key] = body[key];
  }
  if (Object.keys(set).length === 0) {
    return NextResponse.json(
      { error: "no valid fields to update" },
      { status: 400 },
    );
  }
  await getDb();
  const doc = await InvoiceModel.findOneAndUpdate(
    { _id: id },
    { $set: set },
    { new: true, runValidators: true },
  ).lean();
  if (!doc) return NextResponse.json(null, { status: 404 });
  const paymentDocs = await PaymentModel.find({ invoiceId: id }).lean();
  const payments = paymentDocs.map(({ _id, ...payment }) => ({
    ...payment,
    id: _id,
  }));
  const { _id, ...rest } = doc;
  return NextResponse.json({ ...rest, id: _id, payments });
}

export async function getInvoice(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  await getDb();
  const doc = await InvoiceModel.findById(id).lean();
  if (!doc) return NextResponse.json(null, { status: 404 });
  const paymentDocs = await PaymentModel.find({ invoiceId: id }).lean();
  const payments = paymentDocs.map(({ _id, ...payment }) => ({
    ...payment,
    id: _id,
  }));
  const { _id, ...invoice } = doc;
  return NextResponse.json({ ...invoice, id: _id, payments });
}

export async function deleteInvoice(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  await getDb();
  await InvoiceModel.deleteOne({ _id: id });
  await PaymentModel.deleteMany({ invoiceId: id });
  return NextResponse.json({ ok: true });
}
