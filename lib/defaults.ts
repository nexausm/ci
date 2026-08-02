import type { CurrencyCode, InvoiceData } from "./types";
import { CURRENCIES } from "./currency";

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

function newItem() {
  return { id: crypto.randomUUID(), description: "", rate: 0, qty: 1 };
}

export function createDefaultInvoice(): InvoiceData {
  return {
    invoiceNumber: "",
    invoiceDate: todayISO(),
    currency: "BDT",

    billToName: "",
    billToAddress: "",
    billToPhone: "",

    items: [newItem()],

    discountEnabled: false,
    discountValue: 0,

    taxEnabled: false,
    taxLabel: "Tax",
    taxValue: 0,

    amountPaid: 0,

    notes: "",
  };
}

export function sanitizeInvoice(raw: unknown): InvoiceData {
  const defaults = createDefaultInvoice();
  if (!raw || typeof raw !== "object") return defaults;
  const stored = raw as Partial<InvoiceData>;
  const currency: CurrencyCode = CURRENCIES[stored.currency as CurrencyCode]
    ? (stored.currency as CurrencyCode)
    : defaults.currency;
  return {
    ...defaults,
    ...stored,
    currency,
    items:
      Array.isArray(stored.items) && stored.items.length > 0
        ? stored.items
        : defaults.items,
  };
}

export { newItem };

export const STORAGE_KEY = "invoice-tool-data-v1";
