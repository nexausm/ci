import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const db = await getDb();
  await db.collection<{ _id: string }>("clients").deleteOne({ _id: id });
  return NextResponse.json({ ok: true });
}
