import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { sanitizePayment } from "@/lib/defaults";
import { PaymentModel } from "@/models/payments";

const PATCH_FIELDS = ["invoiceId", "date", "amount", "method", "note"] as const;

export async function getPayments(req: Request) {
  await getDb();
  const invoiceId = new URL(req.url).searchParams.get("invoiceId");
  const filter = invoiceId ? { invoiceId } : {};
  const docs = await PaymentModel.find(filter).lean();
  const payments = docs.map(({ _id, ...payment }) => ({
    ...payment,
    id: _id,
  }));
  return NextResponse.json(payments);
}

export async function createPayment(req: Request) {
  const body = await req.json();
  const payment = sanitizePayment(body);
  if (!payment.invoiceId) {
    return NextResponse.json(
      { error: "invoiceId is required" },
      { status: 400 },
    );
  }
  await getDb();
  const { id, ...data } = payment;
  await PaymentModel.updateOne(
    { _id: id },
    { $set: data },
    { upsert: true },
  );
  return NextResponse.json(payment);
}

export async function updatePayment(
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
  const doc = await PaymentModel.findOneAndUpdate(
    { _id: id },
    { $set: set },
    { new: true, runValidators: true },
  ).lean();
  if (!doc) return NextResponse.json(null, { status: 404 });
  const { _id, ...rest } = doc;
  return NextResponse.json({ ...rest, id: _id });
}

export async function getPayment(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  await getDb();
  const doc = await PaymentModel.findById(id).lean();
  if (!doc) return NextResponse.json(null, { status: 404 });
  const { _id, ...payment } = doc;
  return NextResponse.json({ ...payment, id: _id });
}

export async function deletePayment(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  await getDb();
  await PaymentModel.deleteOne({ _id: id });
  return NextResponse.json({ ok: true });
}
