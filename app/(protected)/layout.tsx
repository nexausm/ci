import { redirect } from "next/navigation";
import { SessionProvider } from "next-auth/react";
import { auth } from "@/middlewares/auth";
import { getCompanyInfo } from "@/lib/company";
import { CompanyProvider } from "@/app/providers/company-provider";
import { AuthGuard } from "./auth-guard";
import { DashboardShell } from "@/components/dashboard-shell";

export default async function ProtectedLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  const company = await getCompanyInfo();

  return (
    <CompanyProvider company={company}>
      <SessionProvider>
        <AuthGuard>
          <DashboardShell>{children}</DashboardShell>
        </AuthGuard>
      </SessionProvider>
    </CompanyProvider>
  );
}
