export type { Client, ClientType } from "@/models/clients";
export type { Payment, PaymentMethod } from "@/models/payments";
export type { Product } from "@/models/products";
export type {
  CurrencyCode,
  ExternalCostInfo,
  InvoiceData,
  InvoiceState,
  LineItem,
} from "@/models/invoices";

export const PAYMENT_METHODS = [
  "Cash",
  "Bank Transfer",
  "Card",
  "Mobile Banking",
  "Other",
] as const;

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
