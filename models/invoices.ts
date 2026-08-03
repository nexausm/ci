import { Schema, model, models, type Model } from "mongoose";
import type { ClientType } from "./clients";
import type { Payment } from "./payments";

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

type InvoiceDoc = InvoiceData & { _id: string };

const CLIENT_TYPES: ClientType[] = ["individual", "organization"];
const CURRENCIES: CurrencyCode[] = ["BDT", "USD"];

const externalCostSchema = new Schema(
  {
    vendor: { type: String, default: "" },
    invoiceNumber: { type: String, default: "" },
    billedDate: { type: String, default: "" },
  },
  { id: false, _id: false },
);

const lineItemSchema = new Schema(
  {
    id: { type: String, required: true },
    productId: { type: String, default: null },
    description: { type: String, default: "" },
    rate: { type: Number, default: 0 },
    listRate: { type: Number, default: null },
    qty: { type: Number, default: 1 },
    externalCost: { type: externalCostSchema, default: null },
  },
  { id: false, _id: false },
);

const invoiceSchema = new Schema<InvoiceDoc>(
  {
    _id: { type: String, required: true },
    invoiceNumber: { type: String, default: "" },
    invoiceDate: { type: String, default: "" },
    dueDate: { type: String, default: "" },
    currency: { type: String, enum: CURRENCIES, default: "BDT" },
    clientId: { type: String, default: null },
    billToType: {
      type: String,
      enum: CLIENT_TYPES,
      default: "individual",
    },
    billToName: { type: String, default: "" },
    billToContactName: { type: String, default: "" },
    billToAddress: { type: String, default: "" },
    billToPhone: { type: String, default: "" },
    billToEmail: { type: String, default: "" },
    items: { type: [lineItemSchema], default: [] },
    discountEnabled: { type: Boolean, default: false },
    discountValue: { type: Number, default: 0 },
    taxEnabled: { type: Boolean, default: false },
    taxLabel: { type: String, default: "Tax" },
    taxValue: { type: Number, default: 0 },
    notes: { type: String, default: "" },
    state: { type: String, enum: ["draft", "sent"], default: "draft" },
    createdAt: { type: String, default: "" },
    updatedAt: { type: String, default: "" },
  },
  { versionKey: false, minimize: false },
);

export const InvoiceModel: Model<InvoiceDoc> =
  (models.Invoice as Model<InvoiceDoc> | undefined) ??
  model<InvoiceDoc>("Invoice", invoiceSchema, "invoices");
