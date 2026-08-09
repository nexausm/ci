import type { InvoiceData, InvoiceStatus, InvoiceTotals } from "./types";
import { todayISO } from "./defaults";
import { withInstallmentAllocations } from "./totals";

export function computeStatus(
  data: InvoiceData,
  totals: InvoiceTotals,
): InvoiceStatus {
  if (data.state === "draft") return "draft";
  if (data.installmentsEnabled && data.installments.length > 0) {
    const scheduled = withInstallmentAllocations(
      data.installments,
      data.payments,
    );
    const allPaid = scheduled.every((inst) => inst.status === "paid");
    if (allPaid) return "paid";
    const anyOverdue = scheduled.some(
      (inst) =>
        inst.status !== "paid" && inst.dueDate && inst.dueDate < todayISO(),
    );
    if (anyOverdue) return "overdue";
    if (totals.amountPaid > 0) return "partial";
    return "sent";
  }
  if (totals.total > 0 && totals.balanceDue <= 0) return "paid";
  if (totals.amountPaid > 0) return "partial";
  if (data.dueDate && data.dueDate < todayISO()) return "overdue";
  return "sent";
}

export const STATUS_LABEL: Record<InvoiceStatus, string> = {
  draft: "Draft",
  sent: "Sent",
  partial: "Partially paid",
  paid: "Paid",
  overdue: "Overdue",
};

export const STATUS_VARIANT: Record<
  InvoiceStatus,
  "default" | "secondary" | "destructive" | "outline"
> = {
  draft: "outline",
  sent: "secondary",
  partial: "default",
  paid: "default",
  overdue: "destructive",
};

export const STATUS_DOT: Record<InvoiceStatus, string> = {
  draft: "bg-muted-foreground",
  sent: "bg-blue-500",
  partial: "bg-amber-500",
  paid: "bg-emerald-500",
  overdue: "bg-red-500",
};
