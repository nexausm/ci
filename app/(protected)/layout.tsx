import { redirect } from "next/navigation";
import { SessionProvider } from "next-auth/react";
import { auth } from "@/middlewares/auth";
import { getCompanyInfo } from "@/lib/company";
import { CompanyProvider } from "@/app/providers/company-provider";
import { AppSidebar } from "@/components/app-sidebar";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { AuthGuard } from "./auth-guard";

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
          <SidebarProvider>
            <AppSidebar />
            <SidebarInset className="h-svh">
              <header className="flex h-14 shrink-0 items-center gap-2 border-b px-4">
                <SidebarTrigger className="-ml-1" />
                <Separator
                  orientation="vertical"
                  className="mr-2 data-[orientation=vertical]:h-4"
                />
              </header>
              <div className="flex flex-1 flex-col overflow-y-auto">
                {children}
              </div>
            </SidebarInset>
          </SidebarProvider>
        </AuthGuard>
      </SessionProvider>
    </CompanyProvider>
  );
}
