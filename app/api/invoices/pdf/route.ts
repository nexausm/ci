import { sanitizeInvoice } from "@/lib/defaults";
import { invoicePdfResponse } from "@/lib/invoice-pdf";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const data = sanitizeInvoice(body?.data);
  return invoicePdfResponse(data);
}
