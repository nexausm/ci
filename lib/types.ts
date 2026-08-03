export type {
  Client,
  ClientDoc,
  ClientType,
  CurrencyCode,
  InvoiceData,
  InvoiceDoc,
  InvoiceState,
  LineItem,
  Payment,
  PaymentMethod,
} from "@/models";
export { PAYMENT_METHODS } from "@/models";

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
