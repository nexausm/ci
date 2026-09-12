import { NextResponse } from "next/server";
import { searchRecords } from "@/lib/search";

const EMPTY = { invoices: [], clients: [], products: [], pages: [] };

export async function GET(req: Request) {
  const q = new URL(req.url).searchParams.get("q")?.trim() ?? "";
  if (!q) return NextResponse.json(EMPTY);
  try {
    const results = await searchRecords(q);
    return NextResponse.json(results);
  } catch (err) {
    console.error("[algolia] search error:", err);
    return NextResponse.json({ error: "search failed" }, { status: 502 });
  }
}
