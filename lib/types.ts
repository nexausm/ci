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

export interface InvoiceData {
  invoiceNumber: string;
  invoiceDate: string;
  currency: CurrencyCode;

  billToName: string;
  billToAddress: string;
  billToPhone: string;

  items: LineItem[];

  discountEnabled: boolean;
  discountValue: number;

  taxEnabled: boolean;
  taxLabel: string;
  taxValue: number;

  amountPaid: number;

  notes: string;
}

export interface InvoiceTotals {
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  balanceDue: number;
}
