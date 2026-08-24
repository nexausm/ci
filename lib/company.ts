import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/prisma";
import { createDefaultCompanyProfile } from "./defaults";
import type { CompanyInfo } from "./types";

export const COMPANY_PROFILE_TAG = "company-profile";
export const COMPANY_PROFILE_ID = "default";

type CompanyRow = {
  companyName: string;
  numberLabel: string;
  numberValue: string;
  addressLines: string[];
  phone: string;
  email: string;
  logoUrl: string | null;
};

function rowToCompanyInfo(row: CompanyRow): CompanyInfo {
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

async function loadCompanyInfo(): Promise<CompanyInfo> {
  const row = await prisma.companyProfile.findUnique({
    where: { id: COMPANY_PROFILE_ID },
  });
  if (!row) return createDefaultCompanyProfile();
  return rowToCompanyInfo(row);
}

export const getCompanyInfo = unstable_cache(
  loadCompanyInfo,
  [COMPANY_PROFILE_ID],
  { tags: [COMPANY_PROFILE_TAG] },
);
