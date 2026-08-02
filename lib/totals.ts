import type { InvoiceData, InvoiceTotals } from "./types";

export function computeTotals(data: InvoiceData): InvoiceTotals {
  const subtotal = data.items.reduce(
    (sum, item) => sum + (Number(item.rate) || 0) * (Number(item.qty) || 0),
    0,
  );
  const discount = data.discountEnabled ? Number(data.discountValue) || 0 : 0;
  const tax = data.taxEnabled ? Number(data.taxValue) || 0 : 0;
  const total = subtotal - discount + tax;
  const amountPaid = data.payments.reduce(
    (sum, p) => sum + (Number(p.amount) || 0),
    0,
  );
  const balanceDue = total - amountPaid;

  return { subtotal, discount, tax, total, amountPaid, balanceDue };
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
