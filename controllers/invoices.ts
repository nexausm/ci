import { NextResponse } from "next/server";
import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import {
  sanitizeInvoice,
  sanitizeLineItem,
  sanitizeInstallment,
} from "@/lib/defaults";
import { paymentInstallmentAssignments } from "@/lib/totals";
import type {
  ExternalCostInfo,
  Installment,
  LineItem,
  Payment,
  PaymentMethod,
} from "@/lib/types";

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
  "installmentsEnabled",
  "notes",
  "state",
  "updatedAt",
] as const;

type ExternalCostRow = {
  itemId: string;
  vendor: string;
  invoiceNumber: string;
  billedDate: string;
};

export function toPayment(p: {
  id: string;
  invoiceId: string;
  installmentId: string | null;
  date: string;
  amount: number;
  method: string;
  note: string;
}): Payment {
  return {
    id: p.id,
    invoiceId: p.invoiceId,
    installmentId: p.installmentId,
    date: p.date,
    amount: p.amount,
    method: p.method as PaymentMethod,
    note: p.note,
  };
}

export function toInstallment(p: {
  id: string;
  invoiceId: string;
  seq: number;
  label: string;
  dueDate: string;
  amount: number;
}): Installment {
  return {
    id: p.id,
    invoiceId: p.invoiceId,
    seq: p.seq,
    label: p.label,
    dueDate: p.dueDate,
    amount: p.amount,
  };
}

function externalCostId(invoiceId: string, itemId: string): string {
  return `ec_${invoiceId}_${itemId}`;
}

export function itemsFromJson(value: unknown): LineItem[] {
  return value as LineItem[];
}

function stripExternalCosts(items: LineItem[]): LineItem[] {
  return items.map((item) => {
    const { externalCost: _ec, ...rest } = item;
    void _ec;
    return rest;
  });
}

export function inflateExternalCosts(
  items: LineItem[],
  costs: ExternalCostRow[],
): LineItem[] {
  const byItem = new Map(costs.map((cost) => [cost.itemId, cost]));
  return items.map((item) => {
    const cost = byItem.get(item.id);
    return {
      ...item,
      externalCost: cost
        ? {
            vendor: cost.vendor,
            invoiceNumber: cost.invoiceNumber,
            billedDate: cost.billedDate,
          }
        : null,
    };
  });
}

async function syncExternalCosts(invoiceId: string, items: LineItem[]) {
  const incoming = items.filter(
    (item) => item.externalCost && typeof item.externalCost === "object",
  );
  const incomingIds = new Set(incoming.map((item) => item.id));
  for (const item of incoming) {
    const cost = item.externalCost as ExternalCostInfo;
    const id = externalCostId(invoiceId, item.id);
    await prisma.externalCost.upsert({
      where: { id },
      create: {
        id,
        invoiceId,
        itemId: item.id,
        vendor: cost.vendor,
        invoiceNumber: cost.invoiceNumber,
        billedDate: cost.billedDate,
      },
      update: {
        vendor: cost.vendor,
        invoiceNumber: cost.invoiceNumber,
        billedDate: cost.billedDate,
      },
    });
  }
  await prisma.externalCost.deleteMany({
    where:
      incomingIds.size === 0
        ? { invoiceId }
        : { invoiceId, itemId: { notIn: Array.from(incomingIds) } },
  });
}

async function syncInstallments(
  invoiceId: string,
  installments: Installment[],
) {
  const incoming = installments.filter((i) => i.id);
  const incomingIds = new Set(incoming.map((i) => i.id));
  for (const installment of incoming) {
    const { id, invoiceId: _invoiceId, ...rest } = installment;
    void _invoiceId;
    await prisma.installment.upsert({
      where: { id },
      create: { id, invoiceId, ...rest },
      update: { invoiceId, ...rest },
    });
  }
  await prisma.installment.deleteMany({
    where:
      incomingIds.size === 0
        ? { invoiceId }
        : { invoiceId, id: { notIn: Array.from(incomingIds) } },
  });
}

async function syncPayments(invoiceId: string, payments: Payment[]) {
  const incoming = payments.filter((p) => p.id);
  const incomingIds = new Set(incoming.map((p) => p.id));
  const installments = await prisma.installment.findMany({
    where: { invoiceId },
  });
  const assignment = paymentInstallmentAssignments(installments, incoming);
  for (const payment of incoming) {
    const {
      id,
      invoiceId: _invoiceId,
      installmentId: _installmentId,
      ...rest
    } = payment;
    void _invoiceId;
    const installmentId = _installmentId ?? assignment[payment.id] ?? null;
    await prisma.payment.upsert({
      where: { id },
      create: { id, invoiceId, ...rest, installmentId },
      update: { invoiceId, ...rest, installmentId },
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
    include: { payments: true, externalCosts: true, installments: true },
    orderBy: { createdAt: "asc" },
  });
  const invoices = docs.map(
    ({ payments, externalCosts, installments, ...invoice }) => {
      const items = inflateExternalCosts(
        itemsFromJson(invoice.items),
        externalCosts,
      );
      return sanitizeInvoice({
        ...invoice,
        id: invoice.id,
        items,
        payments: payments.map(toPayment),
        installments: installments.map(toInstallment),
      });
    },
  );
  return NextResponse.json(invoices);
}

export async function createInvoice(req: Request) {
  const body = await req.json();
  const invoice = sanitizeInvoice(body);
  const { id, payments = [], installments = [], items, ...rest } = invoice;
  const data = {
    ...rest,
    items: stripExternalCosts(items) as unknown as Prisma.InputJsonValue,
  };
  await prisma.invoice.upsert({
    where: { id },
    create: { id, ...data },
    update: data,
  });
  await syncInstallments(id, installments);
  await syncPayments(id, payments);
  await syncExternalCosts(id, items);
  const doc = await prisma.invoice.findUnique({
    where: { id },
    include: { payments: true, externalCosts: true, installments: true },
  });
  if (!doc) return NextResponse.json(invoice);
  const {
    payments: storedPayments,
    externalCosts,
    installments: installmentDocs,
    ...stored
  } = doc;
  return NextResponse.json(
    sanitizeInvoice({
      ...stored,
      id: stored.id,
      items: inflateExternalCosts(itemsFromJson(stored.items), externalCosts),
      payments: storedPayments.map(toPayment),
      installments: installmentDocs.map(toInstallment),
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
    if (key === "items") continue;
    if (body[key] !== undefined) set[key] = body[key];
  }
  const patchItems = Array.isArray(body.items)
    ? body.items.map(sanitizeLineItem)
    : undefined;
  if (patchItems) {
    set.items = stripExternalCosts(
      patchItems,
    ) as unknown as Prisma.InputJsonValue;
  }
  const patchInstallments = Array.isArray(body.installments)
    ? body.installments.map(sanitizeInstallment)
    : undefined;
  if (Object.keys(set).length === 0 && !patchInstallments) {
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
  if (patchInstallments) await syncInstallments(id, patchInstallments);
  if (patchItems) await syncExternalCosts(id, patchItems);
  const doc = await prisma.invoice.findUnique({
    where: { id },
    include: { payments: true, externalCosts: true, installments: true },
  });
  if (!doc) return NextResponse.json(null, { status: 404 });
  const { payments, externalCosts, installments, ...stored } = doc;
  return NextResponse.json(
    sanitizeInvoice({
      ...stored,
      id: stored.id,
      items: inflateExternalCosts(itemsFromJson(stored.items), externalCosts),
      payments: payments.map(toPayment),
      installments: installments.map(toInstallment),
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
    include: { payments: true, externalCosts: true, installments: true },
  });
  if (!doc) return NextResponse.json(null, { status: 404 });
  const { payments, externalCosts, installments, ...stored } = doc;
  return NextResponse.json(
    sanitizeInvoice({
      ...stored,
      id: stored.id,
      items: inflateExternalCosts(itemsFromJson(stored.items), externalCosts),
      payments: payments.map(toPayment),
      installments: installments.map(toInstallment),
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
