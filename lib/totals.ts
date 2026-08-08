import type {
  Installment,
  InstallmentStatus,
  InvoiceData,
  InvoiceTotals,
  Payment,
} from "./types";

export interface InstallmentAllocation {
  paidAmount: number;
  balance: number;
  status: InstallmentStatus;
}

const EPS = 0.005;

function sortInstallments(installments: Installment[]): Installment[] {
  return [...installments].sort(
    (a, b) => (a.dueDate || "").localeCompare(b.dueDate || "") || a.seq - b.seq,
  );
}

function sortPayments(payments: Payment[]): Payment[] {
  return [...payments].sort((a, b) =>
    (a.date || "").localeCompare(b.date || ""),
  );
}

export function fifoAllocate(
  installments: Installment[],
  payments: Payment[],
): {
  allocation: Record<string, InstallmentAllocation>;
  assignment: Record<string, string>;
} {
  const allocation: Record<string, InstallmentAllocation> = {};
  const assignment: Record<string, string> = {};
  const sorted = sortInstallments(installments);
  const pool = sortPayments(payments).map((p) => ({
    id: p.id,
    amount: Number(p.amount) || 0,
  }));
  const paid = new Map<string, number>();
  let index = 0;
  for (const inst of sorted) {
    let remaining = Number(inst.amount) || 0;
    while (index < pool.length && remaining > EPS) {
      const payment = pool[index];
      if (payment.amount <= EPS) {
        index += 1;
        continue;
      }
      const used = Math.min(payment.amount, remaining);
      paid.set(inst.id, (paid.get(inst.id) ?? 0) + used);
      if (!assignment[payment.id]) assignment[payment.id] = inst.id;
      remaining -= used;
      payment.amount -= used;
      if (payment.amount <= EPS) index += 1;
    }
  }
  for (const inst of sorted) {
    const paidAmount = paid.get(inst.id) ?? 0;
    const balance = Math.max((Number(inst.amount) || 0) - paidAmount, 0);
    const status: InstallmentStatus =
      balance <= EPS ? "paid" : paidAmount > EPS ? "partial" : "unpaid";
    allocation[inst.id] = { paidAmount, balance, status };
  }
  return { allocation, assignment };
}

export function allocateInstallments(
  installments: Installment[],
  payments: Payment[],
): Record<string, InstallmentAllocation> {
  return fifoAllocate(installments, payments).allocation;
}

export function paymentInstallmentAssignments(
  installments: Installment[],
  payments: Payment[],
): Record<string, string> {
  return fifoAllocate(installments, payments).assignment;
}

export function withInstallmentAllocations(
  installments: Installment[],
  payments: Payment[],
): Installment[] {
  const { allocation } = fifoAllocate(installments, payments);
  return sortInstallments(installments).map((inst) => {
    const alloc = allocation[inst.id];
    return {
      ...inst,
      paidAmount: alloc?.paidAmount ?? 0,
      status: alloc?.status ?? ("unpaid" as InstallmentStatus),
    };
  });
}

export function nextInstallmentDueDate(
  data: Pick<InvoiceData, "installmentsEnabled" | "installments" | "payments">,
): string {
  const next = withInstallmentAllocations(
    data.installments,
    data.payments,
  ).find((inst) => (inst.paidAmount ?? 0) < (Number(inst.amount) || 0) - EPS);
  return next?.dueDate ?? "";
}

export function computeTotals(data: InvoiceData): InvoiceTotals {
  const subtotal = data.items.reduce((sum, item) => {
    const list = Number(item.listRate) || 0;
    const rate = Number(item.rate) || 0;
    return sum + Math.max(list, rate) * (Number(item.qty) || 0);
  }, 0);
  const itemDiscount = data.items.reduce((sum, item) => {
    const list = Number(item.listRate) || 0;
    const rate = Number(item.rate) || 0;
    if (list <= 0 || rate >= list) return sum;
    return sum + (list - rate) * (Number(item.qty) || 0);
  }, 0);
  const manualDiscount = data.discountEnabled
    ? Number(data.discountValue) || 0
    : 0;
  const discount = manualDiscount + itemDiscount;
  const credits = data.creditsEnabled ? Number(data.creditsValue) || 0 : 0;
  const tax = data.taxEnabled ? Number(data.taxValue) || 0 : 0;
  const adjustment = Number(data.adjustmentValue) || 0;
  const total = subtotal - discount - credits + tax + adjustment;
  const amountPaid = data.payments.reduce(
    (sum, p) => sum + (Number(p.amount) || 0),
    0,
  );
  const balanceDue = total - amountPaid;

  return {
    subtotal,
    discount,
    credits,
    tax,
    adjustment,
    total,
    amountPaid,
    balanceDue,
  };
}

export function formatMoney(amount: number, currency: string): string {
  const formatted = Math.abs(amount).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return `${amount < 0 ? "-" : ""}${currency}${formatted}`;
}

export function formatDateLong(iso: string): string {
  if (!iso) return "";
  const [y, m, d] = iso.split("-").map(Number);
  if (!y || !m || !d) return iso;
  const date = new Date(Date.UTC(y, m - 1, d));
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
}
