import { NextResponse } from "next/server";
import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { sanitizeInvoice } from "@/lib/defaults";
import type { Payment, PaymentMethod } from "@/lib/types";

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
  "creditsEnabled",
  "creditsValue",
  "taxEnabled",
  "taxLabel",
  "taxValue",
  "adjustmentValue",
  "notes",
  "state",
  "updatedAt",
] as const;

function toPayment(p: {
  id: string;
  invoiceId: string;
  date: string;
  amount: number;
  method: string;
  note: string;
}): Payment {
  return {
    id: p.id,
    invoiceId: p.invoiceId,
    date: p.date,
    amount: p.amount,
    method: p.method as PaymentMethod,
    note: p.note,
  };
}

async function syncPayments(invoiceId: string, payments: Payment[]) {
  const incoming = payments.filter((p) => p.id);
  const incomingIds = new Set(incoming.map((p) => p.id));
  for (const payment of incoming) {
    const { id, invoiceId: _invoiceId, ...rest } = payment;
    void _invoiceId;
    await prisma.payment.upsert({
      where: { id },
      create: { id, invoiceId, ...rest },
      update: { invoiceId, ...rest },
    });
  }
  await prisma.payment.deleteMany({
    where:
      incomingIds.size === 0
        ? { invoiceId }
        : { invoiceId, id: { notIn: Array.from(incomingIds) } },
  });
}

export async function getInvoices() {
  const docs = await prisma.invoice.findMany({
    include: { payments: true },
    orderBy: { createdAt: "asc" },
  });
  const invoices = docs.map(({ payments, ...invoice }) =>
    sanitizeInvoice({
      ...invoice,
      id: invoice.id,
      payments: payments.map(toPayment),
    }),
  );
  return NextResponse.json(invoices);
}

export async function createInvoice(req: Request) {
  const body = await req.json();
  const invoice = sanitizeInvoice(body);
  const { id, payments = [], items, ...rest } = invoice;
  const data = {
    ...rest,
    items: items as unknown as Prisma.InputJsonValue,
  };
  await prisma.invoice.upsert({
    where: { id },
    create: { id, ...data },
    update: data,
  });
  await syncPayments(id, payments);
  const doc = await prisma.invoice.findUnique({
    where: { id },
    include: { payments: true },
  });
  if (!doc) return NextResponse.json(invoice);
  const { payments: storedPayments, ...stored } = doc;
  return NextResponse.json(
    sanitizeInvoice({
      ...stored,
      id: stored.id,
      payments: storedPayments.map(toPayment),
    }),
  );
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
  try {
    await prisma.invoice.update({
      where: { id },
      data: set as Prisma.InvoiceUpdateInput,
    });
  } catch (err) {
    if (
      err instanceof Prisma.PrismaClientKnownRequestError &&
      err.code === "P2025"
    ) {
      return NextResponse.json(null, { status: 404 });
    }
    throw err;
  }
  const doc = await prisma.invoice.findUnique({
    where: { id },
    include: { payments: true },
  });
  if (!doc) return NextResponse.json(null, { status: 404 });
  const { payments, ...stored } = doc;
  return NextResponse.json(
    sanitizeInvoice({
      ...stored,
      id: stored.id,
      payments: payments.map(toPayment),
    }),
  );
}

export async function getInvoice(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const doc = await prisma.invoice.findUnique({
    where: { id },
    include: { payments: true },
  });
  if (!doc) return NextResponse.json(null, { status: 404 });
  const { payments, ...stored } = doc;
  return NextResponse.json(
    sanitizeInvoice({
      ...stored,
      id: stored.id,
      payments: payments.map(toPayment),
    }),
  );
}

export async function deleteInvoice(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  await prisma.invoice.deleteMany({ where: { id } });
  return NextResponse.json({ ok: true });
}
