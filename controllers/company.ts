import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { prisma } from "@/lib/prisma";
import {
  COMPANY_PROFILE_ID,
  COMPANY_PROFILE_TAG,
  getCompanyInfo,
} from "@/lib/company";
import { sanitizeCompanyProfile } from "@/lib/defaults";

export async function getCompanyProfile() {
  const info = await getCompanyInfo();
  return NextResponse.json(info);
}

export async function updateCompanyProfile(req: Request) {
  const body = await req.json();
  const data = sanitizeCompanyProfile(body);
  const { createdAt, updatedAt, ...fields } = data;
  void createdAt;
  void updatedAt;
  await prisma.companyProfile.upsert({
    where: { id: COMPANY_PROFILE_ID },
    create: { id: COMPANY_PROFILE_ID, ...fields },
    update: fields,
  });
  revalidateTag(COMPANY_PROFILE_TAG, { expire: 0 });
  return NextResponse.json(await getCompanyInfo());
}
