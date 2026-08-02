import { getCompanyInfo } from "@/lib/company";
import { InvoiceForm } from "@/app/components/InvoiceForm";

export default async function Home() {
  const company = await getCompanyInfo();
  return <InvoiceForm company={company} />;
}
