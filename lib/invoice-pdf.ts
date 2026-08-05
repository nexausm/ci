import { NextResponse } from "next/server";
import { getCompanyInfo } from "@/lib/company";
import { invoiceMarkup } from "@/lib/invoice-markup";
import { renderInvoicePdf } from "@/lib/pdf";
import type { InvoiceData } from "@/lib/types";

export async function invoicePdfResponse(
  data: InvoiceData,
): Promise<NextResponse> {
  const company = await getCompanyInfo();
  const buffer = await renderInvoicePdf(invoiceMarkup(data, company));
  const filename = `Invoice-${data.invoiceNumber || "draft"}.pdf`;
  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${filename}"`,
    },
  });
}
