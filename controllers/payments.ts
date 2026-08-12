import { NextResponse } from "next/server";
import { Prisma } from "@/lib/prisma-client";
import { prisma } from "@/lib/prisma";
import { sanitizePayment } from "@/lib/defaults";
import { paymentInstallmentAssignments } from "@/lib/totals";
import type { Payment, PaymentMethod } from "@/lib/types";

const PATCH_FIELDS = [
  "invoiceId",
  "installmentId",
  "date",
  "amount",
  "method",
  "note",
] as const;

function toPayment(p: {
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

function isNotFound(err: unknown): boolean {
  return (
    err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2025"
  );
}

function isForeignKey(err: unknown): boolean {
  return (
    err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2003"
  );
}

export async function getPayments(req: Request) {
  const invoiceId = new URL(req.url).searchParams.get("invoiceId");
  const where = invoiceId ? { invoiceId } : {};
  const docs = await prisma.payment.findMany({
    where,
    orderBy: { createdAt: "asc" },
  });
  return NextResponse.json(docs.map(toPayment));
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
  let installmentId = payment.installmentId ?? null;
  if (!installmentId) {
    const installments = await prisma.installment.findMany({
      where: { invoiceId: payment.invoiceId },
    });
    if (installments.length > 0) {
      const existing = await prisma.payment.findMany({
        where: { invoiceId: payment.invoiceId },
      });
      const assignment = paymentInstallmentAssignments(installments, [
        ...existing.map(toPayment),
        payment,
      ]);
      installmentId = assignment[payment.id] ?? null;
    }
  }
  const { id, invoiceId, ...data } = payment;
  try {
    await prisma.payment.upsert({
      where: { id },
      create: { id, invoiceId, ...data, installmentId },
      update: { invoiceId, ...data, installmentId },
    });
  } catch (err) {
    if (isForeignKey(err)) {
      return NextResponse.json({ error: "invoice not found" }, { status: 400 });
    }
    throw err;
  }
  return NextResponse.json({ ...payment, installmentId });
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
  try {
    const doc = await prisma.payment.update({
      where: { id },
      data: set as Prisma.PaymentUpdateInput,
    });
    return NextResponse.json(toPayment(doc));
  } catch (err) {
    if (isNotFound(err)) return NextResponse.json(null, { status: 404 });
    if (isForeignKey(err)) {
      return NextResponse.json({ error: "invoice not found" }, { status: 400 });
    }
    throw err;
  }
}

export async function getPayment(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const doc = await prisma.payment.findUnique({ where: { id } });
  if (!doc) return NextResponse.json(null, { status: 404 });
  return NextResponse.json(toPayment(doc));
}

export async function deletePayment(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  await prisma.payment.deleteMany({ where: { id } });
  return NextResponse.json({ ok: true });
}
