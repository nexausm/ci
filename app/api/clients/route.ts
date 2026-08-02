import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { sanitizeClient } from "@/lib/defaults";
import type { Client } from "@/lib/types";

interface ClientDoc extends Client {
  _id: string;
}

export async function GET() {
  const db = await getDb();
  const docs = await db.collection<ClientDoc>("clients").find().toArray();
  const clients = docs.map(({ _id, ...client }) => client);
  return NextResponse.json(clients);
}

export async function POST(req: Request) {
  const body = await req.json();
  const client = sanitizeClient(body);
  const db = await getDb();
  await db
    .collection<ClientDoc>("clients")
    .replaceOne({ _id: client.id }, client, { upsert: true });
  return NextResponse.json(client);
}
