import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { sanitizeClient } from "@/lib/defaults";
import { ClientModel } from "@/models/clients";

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
  await getDb();
  const docs = await ClientModel.find().lean();
  const clients = docs.map(({ _id, ...client }) => ({ ...client, id: _id }));
  return NextResponse.json(clients);
}

export async function createClient(req: Request) {
  const body = await req.json();
  const client = sanitizeClient(body);
  await getDb();
  const { id, ...data } = client;
  await ClientModel.updateOne(
    { _id: id },
    { $set: data },
    { upsert: true },
  );
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
  await getDb();
  const doc = await ClientModel.findOneAndUpdate(
    { _id: id },
    { $set: set },
    { new: true, runValidators: true },
  ).lean();
  if (!doc) return NextResponse.json(null, { status: 404 });
  const { _id, ...rest } = doc;
  return NextResponse.json({ ...rest, id: _id });
}

export async function deleteClient(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  await getDb();
  await ClientModel.deleteOne({ _id: id });
  return NextResponse.json({ ok: true });
}
