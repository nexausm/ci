import { Schema, model, models, type Model } from "mongoose";
import { PAYMENT_METHODS } from "@/lib/types";

export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

export interface Payment {
  id: string;
  invoiceId?: string;
  date: string;
  amount: number;
  method: PaymentMethod;
  note: string;
}

type PaymentDoc = Payment & { _id: string };

const paymentSchema = new Schema<PaymentDoc>(
  {
    _id: { type: String, required: true },
    invoiceId: { type: String, required: true, index: true },
    date: { type: String, default: "" },
    amount: { type: Number, default: 0 },
    method: { type: String, enum: PAYMENT_METHODS, default: "Cash" },
    note: { type: String, default: "" },
  },
  { versionKey: false, minimize: false },
);

export const PaymentModel: Model<PaymentDoc> =
  (models.Payment as Model<PaymentDoc> | undefined) ??
  model<PaymentDoc>("Payment", paymentSchema, "payments");
