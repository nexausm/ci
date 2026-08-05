import { COMPANY_INFO } from "@/generated/assets";
import type { CompanyInfo } from "./types";

export async function getCompanyInfo(): Promise<CompanyInfo> {
  return COMPANY_INFO;
}
