import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { sanitizeClient } from "@/lib/defaults";
import { ClientModel } from "@/models/clients";

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
  await ClientModel.updateOne({ _id: id }, { $set: data }, { upsert: true });
  return NextResponse.json(client);
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
