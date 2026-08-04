import { NextResponse } from "next/server";
import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { sanitizeClient } from "@/lib/defaults";

const PATCH_FIELDS = [
  "type",
  "name",
  "contactName",
  "email",
  "phone",
  "addressLines",
  "notes",
  "updatedAt",
] as const;

export async function getClients() {
  const clients = await prisma.client.findMany({
    orderBy: { createdAt: "asc" },
  });
  return NextResponse.json(clients);
}

export async function createClient(req: Request) {
  const body = await req.json();
  const client = sanitizeClient(body);
  const { id, createdAt, updatedAt, ...data } = client;
  void createdAt;
  void updatedAt;
  await prisma.client.upsert({
    where: { id },
    create: { id, ...data },
    update: data,
  });
  return NextResponse.json(client);
}

export async function updateClient(
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
    const doc = await prisma.client.update({
      where: { id },
      data: set as Prisma.ClientUpdateInput,
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

export async function deleteClient(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  await prisma.client.deleteMany({ where: { id } });
  return NextResponse.json({ ok: true });
}
