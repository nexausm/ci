import type { ClientType } from "./client";
import type { Payment } from "./payment";

export interface LineItem {
  id: string;
  description: string;
  rate: number;
  qty: number;
}

export type CurrencyCode = "BDT" | "USD";

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

export interface InvoiceDoc extends InvoiceData {
  _id: string;
}
