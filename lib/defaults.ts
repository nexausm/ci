import type { Client, CurrencyCode, InvoiceData, Payment } from "./types";
import { CURRENCIES } from "./currency";
import { genId } from "./id";
import { PAYMENT_METHODS } from "./types";

export function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

function addDaysISO(iso: string, days: number): string {
  const [y, m, d] = iso.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

export function newItem() {
  return { id: genId(), description: "", rate: 0, qty: 1 };
}

export function createDefaultInvoice(): InvoiceData {
  const today = todayISO();
  const now = new Date().toISOString();
  return {
    id: genId(),
    invoiceNumber: "",
    invoiceDate: today,
    dueDate: addDaysISO(today, 14),
    currency: "BDT",

    clientId: null,
    billToType: "individual",
    billToName: "",
    billToContactName: "",
    billToAddress: "",
    billToPhone: "",
    billToEmail: "",

    items: [newItem()],

    discountEnabled: false,
    discountValue: 0,

    taxEnabled: false,
    taxLabel: "Tax",
    taxValue: 0,

    payments: [],

    notes: "",
    state: "draft",

    createdAt: now,
    updatedAt: now,
  };
}

export function createDefaultClient(): Client {
  const now = new Date().toISOString();
  return {
    id: genId(),
    type: "individual",
    name: "",
    contactName: "",
    email: "",
    phone: "",
    addressLines: [],
    notes: "",
    createdAt: now,
    updatedAt: now,
  };
}

export function newPayment(): Payment {
  return {
    id: genId(),
    date: todayISO(),
    amount: 0,
    method: "Cash",
    note: "",
  };
}

export function sanitizePayment(raw: unknown): Payment {
  const defaults = newPayment();
  if (!raw || typeof raw !== "object") return defaults;
  const stored = raw as Partial<Payment>;
  const method = PAYMENT_METHODS.includes(stored.method as Payment["method"])
    ? (stored.method as Payment["method"])
    : defaults.method;
  return {
    ...defaults,
    ...stored,
    method,
    amount: Number(stored.amount) || 0,
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
    payments: Array.isArray(stored.payments) ? stored.payments : [],
  };
}

export function sanitizeClient(raw: unknown): Client {
  const defaults = createDefaultClient();
  if (!raw || typeof raw !== "object") return defaults;
  const stored = raw as Partial<Client>;
  return {
    ...defaults,
    ...stored,
    addressLines: Array.isArray(stored.addressLines)
      ? stored.addressLines
      : defaults.addressLines,
  };
}
