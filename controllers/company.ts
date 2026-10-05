import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { COMPANY_PROFILE_ID, getCompanyInfo } from "@/lib/company";
import { sanitizeCompanyProfile } from "@/lib/defaults";

export async function getCompanyProfile() {
  return NextResponse.json(await getCompanyInfo());
}

export async function updateCompanyProfile(req: Request) {
  const fields = sanitizeCompanyProfile(await req.json());
  await prisma.companyProfile.upsert({
    where: { id: COMPANY_PROFILE_ID },
    create: { id: COMPANY_PROFILE_ID, ...fields },
    update: fields,
  });
  return NextResponse.json(await getCompanyInfo());
}
