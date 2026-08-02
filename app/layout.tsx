import type { Metadata } from "next";
import { Inter, Geist } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { getCompanyInfo } from "@/lib/company";
import { CompanyProvider } from "@/app/providers/company-provider";
import { NavBar } from "@/app/components/nav-bar";
import { Toaster } from "@/components/ui/sonner";

const geist = Geist({ subsets: ["latin"], variable: "--font-sans" });

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Nexaus Invoice",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const company = await getCompanyInfo();

  return (
    <html
      lang="en"
      className={cn(
        "h-full",
        "antialiased",
        inter.variable,
        "font-sans",
        geist.variable,
      )}
    >
      <body className="min-h-full flex flex-col bg-muted/30">
        <CompanyProvider company={company}>
          <NavBar />
          <main className="flex-1">{children}</main>
          <Toaster richColors position="top-right" />
        </CompanyProvider>
      </body>
    </html>
  );
}
