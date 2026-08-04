import type {
  Client,
  CurrencyCode,
  InvoiceData,
  LineItem,
  Payment,
  Product,
} from "./types";
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

export function newItem(): LineItem {
  return {
    id: genId(),
    productId: null,
    description: "",
    rate: 0,
    listRate: null,
    qty: 1,
    externalCost: null,
  };
}

export function newExternalCostItem(): LineItem {
  return {
    id: genId(),
    productId: null,
    description: "",
    rate: 0,
    listRate: 0,
    qty: 1,
    externalCost: { vendor: "", invoiceNumber: "", billedDate: todayISO() },
  };
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

    creditsEnabled: false,
    creditsValue: 0,

    taxEnabled: false,
    taxLabel: "Tax",
    taxValue: 0,

    adjustmentValue: 0,

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

export function createDefaultProduct(): Product {
  const now = new Date().toISOString();
  return {
    id: genId(),
    name: "",
    description: "",
    basePriceUsd: 0,
    basePriceBdt: 0,
    discountedPriceUsd: null,
    discountedPriceBdt: null,
    createdAt: now,
    updatedAt: now,
  };
}

export function productPriceFor(
  product: Product,
  currency: CurrencyCode,
): { base: number; rate: number } {
  const usd = currency === "USD";
  const base = usd
    ? Number(product.basePriceUsd) || 0
    : Number(product.basePriceBdt) || 0;
  const discounted = usd
    ? product.discountedPriceUsd
    : product.discountedPriceBdt;
  const rate =
    discounted !== null && discounted !== undefined
      ? Number(discounted) || 0
      : base;
  return { base, rate };
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

export function sanitizeLineItem(raw: unknown): LineItem {
  const defaults = newItem();
  if (!raw || typeof raw !== "object") return defaults;
  const stored = raw as Partial<LineItem>;
  const externalCost = stored.externalCost as
    Partial<LineItem["externalCost"]> | null | undefined;
  return {
    ...defaults,
    ...stored,
    productId: stored.productId ?? null,
    rate: Number(stored.rate) || 0,
    listRate:
      stored.listRate === null || stored.listRate === undefined
        ? null
        : Number(stored.listRate) || 0,
    qty: Number(stored.qty) || 0,
    externalCost:
      !externalCost || typeof externalCost !== "object"
        ? null
        : {
            vendor: String(externalCost.vendor ?? ""),
            invoiceNumber: String(externalCost.invoiceNumber ?? ""),
            billedDate: String(externalCost.billedDate ?? ""),
          },
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
        ? stored.items.map(sanitizeLineItem)
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

function sanitizeOptionalPrice(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;
  return Number(value) || 0;
}

export function sanitizeProduct(raw: unknown): Product {
  const defaults = createDefaultProduct();
  if (!raw || typeof raw !== "object") return defaults;
  const stored = raw as Partial<Product>;
  return {
    ...defaults,
    ...stored,
    basePriceUsd: Number(stored.basePriceUsd) || 0,
    basePriceBdt: Number(stored.basePriceBdt) || 0,
    discountedPriceUsd: sanitizeOptionalPrice(stored.discountedPriceUsd),
    discountedPriceBdt: sanitizeOptionalPrice(stored.discountedPriceBdt),
  };
}
