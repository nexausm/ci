import { notFound } from "next/navigation";
import { getDb } from "@/lib/mongodb";
import { InvoiceModel } from "@/models/invoices";
import { PaymentModel } from "@/models/payments";
import { sanitizeInvoice } from "@/lib/defaults";
import { computeTotals, formatDateLong, formatMoney } from "@/lib/totals";
import { CURRENCIES } from "@/lib/currency";

export const dynamic = "force-dynamic";

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
  const money = (amount: number) =>
    `${data.currency} ${formatMoney(amount, symbol)}`;

  const installments = payments.length;
  const lastPayment = installments > 0 ? payments[installments - 1] : null;
  const fullyPaid = totals.amountPaid > 0 && totals.balanceDue <= 0.005;

  const sentences = [
    `Invoice ${data.invoiceNumber || "—"} was issued on ${formatDateLong(
      data.invoiceDate,
    )} for a total of ${money(totals.total)}.`,
  ];

  if (totals.credits > 0) {
    sentences.push(`A credit of ${money(totals.credits)} has been applied.`);
  }

  if (totals.amountPaid <= 0) {
    sentences.push("No payment has been received against this invoice.");
  } else {
    const installmentsText =
      installments === 1
        ? "payment"
        : `${installments} payments`;
    const lastText = lastPayment
      ? ` The last was ${money(lastPayment.amount)} via ${
          lastPayment.method
        } on ${formatDateLong(lastPayment.date)}.`
      : "";
    sentences.push(
      fullyPaid
        ? `This invoice has been paid in full in ${installmentsText}.${lastText}`
        : `${money(totals.amountPaid)} has been received in ${installmentsText}.${lastText}`,
    );
  }

  if (fullyPaid) {
    sentences.push("Nothing remains due.");
  } else {
    sentences.push(
      `A balance of ${money(Math.max(totals.balanceDue, 0))} remains due.`,
    );
  }

  return (
    <main className="flex min-h-svh items-center justify-center px-4">
      <div className="max-w-xl space-y-3 text-base leading-relaxed text-foreground sm:text-lg">
        {sentences.map((sentence) => (
          <p key={sentence}>{sentence}</p>
        ))}
      </div>
    </main>
  );
}
