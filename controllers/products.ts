import { NextResponse } from "next/server";
import { Prisma } from "@/lib/prisma-client";
import { prisma } from "@/lib/prisma";
import { sanitizeProduct } from "@/lib/defaults";

const PATCH_FIELDS = [
  "name",
  "description",
  "basePriceUsd",
  "basePriceBdt",
  "discountedPriceUsd",
  "discountedPriceBdt",
  "updatedAt",
] as const;

export async function getProducts() {
  const products = await prisma.product.findMany({
    orderBy: { createdAt: "asc" },
  });
  return NextResponse.json(products);
}

export async function createProduct(req: Request) {
  const body = await req.json();
  const product = sanitizeProduct(body);
  const { id, createdAt, updatedAt, ...data } = product;
  void createdAt;
  void updatedAt;
  await prisma.product.upsert({
    where: { id },
    create: { id, ...data },
    update: data,
  });
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
  try {
    const doc = await prisma.product.update({
      where: { id },
      data: set as Prisma.ProductUpdateInput,
    });
    return NextResponse.json(doc);
  } catch (err) {
    if (
      err instanceof Prisma.PrismaClientKnownRequestError &&
      err.code === "P2025"
    ) {
      return NextResponse.json(null, { status: 404 });
    }
    throw err;
  }
}

export async function deleteProduct(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  await prisma.product.deleteMany({ where: { id } });
  return NextResponse.json({ ok: true });
}
