import { Schema, model, models, type Model } from "mongoose";

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

type ClientDoc = Client & { _id: string };

const CLIENT_TYPES: ClientType[] = ["individual", "organization"];

const clientSchema = new Schema<ClientDoc>(
  {
    _id: { type: String, required: true },
    type: {
      type: String,
      enum: CLIENT_TYPES,
      default: "individual",
    },
    name: { type: String, default: "" },
    contactName: { type: String, default: "" },
    email: { type: String, default: "" },
    phone: { type: String, default: "" },
    addressLines: { type: [String], default: [] },
    notes: { type: String, default: "" },
    createdAt: { type: String, default: "" },
    updatedAt: { type: String, default: "" },
  },
  { versionKey: false, minimize: false },
);

export const ClientModel: Model<ClientDoc> =
  (models.Client as Model<ClientDoc> | undefined) ??
  model<ClientDoc>("Client", clientSchema, "clients");
