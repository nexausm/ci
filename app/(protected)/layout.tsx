import { SessionProvider } from "next-auth/react";
import { auth } from "@/auth";
import { getCompanyInfo } from "@/lib/company";
import { CompanyProvider } from "@/app/providers/company-provider";
import { DashboardShell } from "@/components/dashboard-shell";

export default async function ProtectedLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await auth();

  const company = await getCompanyInfo();

  return (
    <CompanyProvider company={company}>
      <SessionProvider session={session}>
        <DashboardShell>{children}</DashboardShell>
      </SessionProvider>
    </CompanyProvider>
  );
}
