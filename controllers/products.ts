import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { sanitizeProduct } from "@/lib/defaults";
import { ProductModel } from "@/models/products";

const PATCH_FIELDS = [
  "name",
  "description",
  "basePrice",
  "discountedPrice",
  "updatedAt",
] as const;

export async function getProducts() {
  await getDb();
  const docs = await ProductModel.find().lean();
  const products = docs.map(({ _id, ...product }) => ({
    ...product,
    id: _id,
  }));
  return NextResponse.json(products);
}

export async function createProduct(req: Request) {
  const body = await req.json();
  const product = sanitizeProduct(body);
  await getDb();
  const { id, ...data } = product;
  await ProductModel.updateOne({ _id: id }, { $set: data }, { upsert: true });
  return NextResponse.json(product);
}

export async function updateProduct(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const body = await req.json();
  const set: Record<string, unknown> = {};
  for (const key of PATCH_FIELDS) {
    if (body[key] !== undefined) set[key] = body[key];
  }
  if (Object.keys(set).length === 0) {
    return NextResponse.json(
      { error: "no valid fields to update" },
      { status: 400 },
    );
  }
  await getDb();
  const doc = await ProductModel.findOneAndUpdate(
    { _id: id },
    { $set: set },
    { new: true, runValidators: true },
  ).lean();
  if (!doc) return NextResponse.json(null, { status: 404 });
  const { _id, ...rest } = doc;
  return NextResponse.json({ ...rest, id: _id });
}

export async function deleteProduct(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  await getDb();
  await ProductModel.deleteOne({ _id: id });
  return NextResponse.json({ ok: true });
}
