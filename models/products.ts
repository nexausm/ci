import { Schema, model, models, type Model } from "mongoose";

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

type ProductDoc = Product & { _id: string };

const productSchema = new Schema<ProductDoc>(
  {
    _id: { type: String, required: true },
    name: { type: String, default: "" },
    description: { type: String, default: "" },
    basePriceUsd: { type: Number, default: 0 },
    basePriceBdt: { type: Number, default: 0 },
    discountedPriceUsd: { type: Number, default: null },
    discountedPriceBdt: { type: Number, default: null },
    createdAt: { type: String, default: "" },
    updatedAt: { type: String, default: "" },
  },
  { versionKey: false, minimize: false },
);

export const ProductModel: Model<ProductDoc> =
  (models.Product as Model<ProductDoc> | undefined) ??
  model<ProductDoc>("Product", productSchema, "products");
