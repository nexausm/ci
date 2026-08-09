import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { sanitizeInvoice, sanitizeInstallment } from "@/lib/defaults";
import {
  computeTotals,
  formatDateLong,
  formatMoney,
  withInstallmentAllocations,
} from "@/lib/totals";
import { CURRENCIES } from "@/lib/currency";
import type { PaymentMethod } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function PublicInvoicePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const doc = await prisma.invoice.findUnique({
    where: { id },
    include: { payments: true, installments: true },
  });
  if (!doc) notFound();
  const {
    payments: paymentDocs,
    installments: installmentDocs,
    ...invoice
  } = doc;

  const payments = paymentDocs
    .map((p) => ({
      id: p.id,
      date: p.date,
      amount: p.amount,
      method: p.method as PaymentMethod,
      note: p.note,
    }))
    .sort((a, b) => a.date.localeCompare(b.date));

  const data = sanitizeInvoice({
    ...invoice,
    id: invoice.id,
    payments,
    installments: installmentDocs.map(sanitizeInstallment),
  });
  const totals = computeTotals(data);
  const symbol = CURRENCIES[data.currency]?.symbol ?? "$";
  const money = (amount: number) =>
    `${data.currency} ${formatMoney(amount, symbol)}`;

  const scheduled =
    data.installmentsEnabled && data.installments.length > 0
      ? withInstallmentAllocations(data.installments, payments)
      : [];

  const paymentCount = payments.length;
  const lastPayment = paymentCount > 0 ? payments[paymentCount - 1] : null;
  const fullyPaid = totals.amountPaid > 0 && totals.balanceDue <= 0.005;

  const sentences = [
    `Invoice ${data.invoiceNumber || "—"} has a total of ${money(totals.total)}.`,
  ];

  if (totals.credits > 0) {
    sentences.push(`A credit of ${money(totals.credits)} has been applied.`);
  }

  if (scheduled.length > 0) {
    sentences.push(
      `Payment is split into ${scheduled.length} installment${
        scheduled.length === 1 ? "" : "s"
      }. Each installment is listed below with its amount, due date, and status.`,
    );
  }

  if (totals.amountPaid <= 0) {
    sentences.push("No payment has been received against this invoice.");
  } else {
    const installmentsText =
      paymentCount === 1 ? "payment" : `${paymentCount} payments`;
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
  } else if (scheduled.length > 0) {
    sentences.push(
      `${money(totals.amountPaid)} has been paid; ${money(
        Math.max(totals.balanceDue, 0),
      )} remains due across the installments below.`,
    );
  } else {
    sentences.push(
      `A balance of ${money(Math.max(totals.balanceDue, 0))} remains due.`,
    );
  }

  return (
    <main className="flex min-h-svh items-center justify-center px-4">
      <div className="w-full max-w-xl space-y-3 text-base leading-relaxed text-foreground sm:text-lg">
        {sentences.map((sentence) => (
          <p key={sentence}>{sentence}</p>
        ))}

        {scheduled.length > 0 && (
          <div className="overflow-hidden rounded-md border text-sm">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b bg-muted/50 text-left text-muted-foreground">
                  <th className="px-3 py-2 font-medium">Installment</th>
                  <th className="px-3 py-2 font-medium">Due date</th>
                  <th className="px-3 py-2 text-right font-medium">Amount</th>
                  <th className="px-3 py-2 text-right font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {scheduled.map((inst) => {
                  const status =
                    inst.status === "paid"
                      ? "Paid"
                      : inst.status === "partial"
                        ? "Partial"
                        : "Unpaid";
                  return (
                    <tr key={inst.id} className="border-b last:border-0">
                      <td className="px-3 py-2">
                        <span className="font-medium">#{inst.seq + 1}</span>
                        {inst.label ? (
                          <span className="ml-2 text-muted-foreground">
                            {inst.label}
                          </span>
                        ) : null}
                      </td>
                      <td className="px-3 py-2 text-muted-foreground">
                        {formatDateLong(inst.dueDate) || "—"}
                      </td>
                      <td className="px-3 py-2 text-right">
                        {money(inst.amount)}
                        {inst.paidAmount ? (
                          <span className="block text-xs text-muted-foreground">
                            {money(inst.paidAmount)} paid
                          </span>
                        ) : null}
                      </td>
                      <td className="px-3 py-2 text-right text-muted-foreground">
                        {status}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </main>
  );
}
