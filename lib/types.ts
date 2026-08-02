export interface LineItem {
  id: string;
  description: string;
  rate: number;
  qty: number;
}

export type CurrencyCode = "BDT" | "USD";

export interface CompanyInfo {
  companyName: string;
  numberLabel: string;
  numberValue: string;
  addressLines: string[];
  phone: string;
  email: string;
  logoDataUri: string | null;
}

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
  date: string;
  amount: number;
  method: PaymentMethod;
  note: string;
}

export type InvoiceState = "draft" | "sent";

export interface InvoiceData {
  id: string;
  invoiceNumber: string;
  invoiceDate: string;
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

  taxEnabled: boolean;
  taxLabel: string;
  taxValue: number;

  payments: Payment[];

  notes: string;
  state: InvoiceState;

  createdAt: string;
  updatedAt: string;
}

export interface InvoiceTotals {
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  amountPaid: number;
  balanceDue: number;
}

export type InvoiceStatus = "draft" | "paid" | "partial" | "overdue" | "sent";

export interface InvoiceStatusInfo {
  key: InvoiceStatus;
  label: string;
}
