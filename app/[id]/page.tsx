import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getDb } from "@/lib/mongodb";
import { InvoiceModel } from "@/models/invoices";
import { PaymentModel } from "@/models/payments";
import { sanitizeInvoice } from "@/lib/defaults";
import { computeTotals, formatDateLong, formatMoney } from "@/lib/totals";
import { CURRENCIES } from "@/lib/currency";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  return { title: `Invoice ${id.slice(0, 8)}` };
}

export default async function PublicInvoicePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  await getDb();
  const doc = await InvoiceModel.findById(id).lean();
  if (!doc) notFound();
  const { _id, ...invoice } = doc;

  const paymentDocs = await PaymentModel.find({ invoiceId: id }).lean();
  const payments = paymentDocs
    .map(({ _id: paymentId, ...payment }) => ({ ...payment, id: paymentId }))
    .sort((a, b) => a.date.localeCompare(b.date));

  const data = sanitizeInvoice({ ...invoice, id: _id, payments });
  const totals = computeTotals(data);
  const symbol = CURRENCIES[data.currency]?.symbol ?? "$";

  const installments = payments.length;
  const lastPaid = installments > 0 ? payments[installments - 1].date : null;

  const line = [
    "INVOICE",
    data.invoiceNumber || "—",
    "billed at",
    formatDateLong(data.invoiceDate),
    "price",
    formatMoney(totals.total, symbol),
    "and paid",
    formatMoney(totals.amountPaid, symbol),
    "amount",
    lastPaid ? `till ${formatDateLong(lastPaid)}` : null,
    `in ${installments} installments`,
    "and",
    formatMoney(totals.credits, symbol),
    "credits applied",
  ]
    .filter((part): part is string => part !== null)
    .join(" ");

  return (
    <main className="flex min-h-svh items-center justify-center px-4">
      <p className="max-w-3xl text-center text-lg font-medium leading-relaxed text-foreground sm:text-xl">
        {line}
      </p>
    </main>
  );
}
