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
import {
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui";
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
      <div className="text-foreground w-full max-w-xl space-y-3 text-base leading-relaxed sm:text-lg">
        {sentences.map((sentence) => (
          <p key={sentence}>{sentence}</p>
        ))}

        {scheduled.length > 0 && (
          <Card className="py-0">
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Installment</TableHead>
                    <TableHead>Due date</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead className="text-right">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {scheduled.map((inst) => {
                    const status =
                      inst.status === "paid"
                        ? "Paid"
                        : inst.status === "partial"
                          ? "Partial"
                          : "Unpaid";
                    return (
                      <TableRow key={inst.id}>
                        <TableCell>
                          <span className="font-medium">#{inst.seq + 1}</span>
                          {inst.label ? (
                            <span className="text-muted-foreground ml-2">
                              {inst.label}
                            </span>
                          ) : null}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {formatDateLong(inst.dueDate) || "—"}
                        </TableCell>
                        <TableCell className="text-right">
                          {money(inst.amount)}
                          {inst.paidAmount ? (
                            <span className="text-muted-foreground block text-xs">
                              {money(inst.paidAmount)} paid
                            </span>
                          ) : null}
                        </TableCell>
                        <TableCell className="text-muted-foreground text-right">
                          {status}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </div>
    </main>
  );
}
