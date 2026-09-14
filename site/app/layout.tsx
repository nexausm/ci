import type { Metadata } from "next";
import localFont from "next/font/local";

import "./globals.css";

export const metadata: Metadata = {
  title: "Cloud Invoice by Nexaus",
  description:
    "Open-source, self-hostable cloud invoice manager. Create invoices, manage clients and products, and track payments on time.",
};

const inter = localFont({
  src: "../assets/fonts/InterVariable.woff2",
  weight: "100 900",
  variable: "--font-inter",
  display: "swap",
});

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`h-full antialiased ${inter.variable}`}>
      <body className="bg-background text-foreground min-h-full">
        {children}
      </body>
    </html>
  );
}
