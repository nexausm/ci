export type ClientType = "individual" | "organization";

export interface Client {
  id: string;
  type: ClientType;
  name: string;
  contactName: string;
  email: string;
  phone: string;
  addressLines: string[];
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export interface ExternalCostInfo {
  vendor: string;
  invoiceNumber: string;
  billedDate: string;
}

export interface LineItem {
  id: string;
  productId: string | null;
  description: string;
  rate: number;
  listRate: number | null;
  qty: number;
  externalCost?: ExternalCostInfo | null;
}

export type CurrencyCode = "BDT" | "USD";

export type InvoiceState = "draft" | "sent";

export interface InvoiceData {
  id: string;
  invoiceNumber: string;
  dueDate: string;
  currency: CurrencyCode;

  clientId: string | null;
  billToType: ClientType;
  billToName: string;
  billToContactName: string;
  billToAddress: string;
  billToPhone: string;
  billToEmail: string;

  items: LineItem[];

  discountEnabled: boolean;
  discountValue: number;

  creditsEnabled: boolean;
  creditsValue: number;

  taxEnabled: boolean;
  taxLabel: string;
  taxValue: number;

  adjustmentValue: number;

  installmentsEnabled: boolean;
  installments: Installment[];

  payments: Payment[];

  notes: string;
  state: InvoiceState;

  createdAt: string;
  updatedAt: string;
}

export const PAYMENT_METHODS = [
  "Cash",
  "Bank Transfer",
  "Card",
  "Mobile Banking",
  "Other",
] as const;

export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

export interface Payment {
  id: string;
  invoiceId?: string;
  installmentId?: string | null;
  date: string;
  amount: number;
  method: PaymentMethod;
  note: string;
}

export type InstallmentStatus = "unpaid" | "partial" | "paid";

export interface Installment {
  id: string;
  invoiceId?: string;
  seq: number;
  label: string;
  dueDate: string;
  amount: number;
  paidAmount?: number;
  status?: InstallmentStatus;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  basePriceUsd: number;
  basePriceBdt: number;
  discountedPriceUsd: number | null;
  discountedPriceBdt: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface CompanyInfo {
  companyName: string;
  numberLabel: string;
  numberValue: string;
  addressLines: string[];
  phone: string;
  email: string;
  logoDataUri: string | null;
}

export interface InvoiceTotals {
  subtotal: number;
  discount: number;
  credits: number;
  tax: number;
  adjustment: number;
  total: number;
  amountPaid: number;
  balanceDue: number;
}

export type InvoiceStatus = "draft" | "paid" | "partial" | "overdue" | "sent";

export interface InvoiceStatusInfo {
  key: InvoiceStatus;
  label: string;
}
