import type { InvoiceData, InvoiceTotals } from "./types";

export function computeTotals(data: InvoiceData): InvoiceTotals {
  const subtotal = data.items.reduce(
    (sum, item) => {
      const list = Number(item.listRate) || 0;
      const rate = Number(item.rate) || 0;
      return sum + Math.max(list, rate) * (Number(item.qty) || 0);
    },
    0,
  );
  const itemDiscount = data.items.reduce(
    (sum, item) => {
      const list = Number(item.listRate) || 0;
      const rate = Number(item.rate) || 0;
      if (list <= 0 || rate >= list) return sum;
      return sum + (list - rate) * (Number(item.qty) || 0);
    },
    0,
  );
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
