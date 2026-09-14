import type { Metadata } from "next";

import { Features } from "@site/components/landing/features";
import { GetStarted } from "@site/components/landing/get-started";
import { Hero } from "@site/components/landing/hero";
import { OpenSource } from "@site/components/landing/open-source";
import { SiteFooter } from "@site/components/landing/site-footer";
import { SiteHeader } from "@site/components/landing/site-header";

export const metadata: Metadata = {
  title: "Cloud Invoice by Nexaus",
  description:
    "Open-source, self-hostable cloud invoice manager. Create invoices, manage clients, products and track payments on time.",
  openGraph: {
    title: "Cloud Invoice by Nexaus",
    description:
      "Open-source, self-hostable cloud invoice manager. Create invoices, manage clients, products and track payments on time.",
    type: "website",
  },
};

export default function HomePage() {
  return (
    <div className="bg-background flex min-h-svh flex-col">
      <SiteHeader />
      <main className="flex-1">
        <Hero />
        <Features />
        <GetStarted />
        <OpenSource />
      </main>
      <SiteFooter />
    </div>
  );
}
