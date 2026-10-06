import { prisma } from "@/lib/prisma";
import { createDefaultCompanyProfile } from "./defaults";
import type { CompanyInfo } from "./types";

export const COMPANY_PROFILE_ID = "default";

export async function getCompanyInfo(): Promise<CompanyInfo> {
  const row = await prisma.companyProfile.findUnique({
    where: { id: COMPANY_PROFILE_ID },
  });
  if (!row) return createDefaultCompanyProfile();
  return {
    companyName: row.companyName,
    numberLabel: row.numberLabel,
    numberValue: row.numberValue,
    addressLines: row.addressLines,
    phone: row.phone,
    email: row.email,
    logoUrl: row.logoUrl,
  };
}
