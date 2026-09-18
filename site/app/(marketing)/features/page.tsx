import type { Metadata } from "next";
import {
  BarChart3,
  Building2,
  FileText,
  Package,
  ShieldCheck,
  Users,
  Wallet,
} from "lucide-react";
import Link from "next/link";

import { buttonVariants } from "@site/components/ui/button";
import { cn } from "@site/lib/utils";
import { GITHUB_REPO_URL } from "@site/lib/site";

export const metadata: Metadata = {
  title: "Features | Cloud Invoice",
  description:
    "Generate invoices, track payments, manage clients and products from one clean, self-hosted dashboard.",
  openGraph: {
    title: "Features | Cloud Invoice",
    description:
      "Generate invoices, track payments, manage clients and products from one clean, self-hosted dashboard.",
    type: "website",
  },
};

const groups = [
  {
    icon: FileText,
    title: "Invoices",
    description:
      "Generate clean, numbered invoices in seconds. Mark them paid and keep a permanent record of every document.",
    points: [
      "Automatic sequential numbering",
      "Discounts, credits and tax support",
      "Line-item adjustments and installments",
      "Bundled PDF engine for pixel-perfect output",
    ],
  },
  {
    icon: Wallet,
    title: "Track payments",
    description:
      "See the full lifecycle of each invoice: draft, sent, paid, overdue — alongside monthly totals at a glance.",
    points: [
      "Status lifecycle for every invoice",
      "Monthly totals and pending balances",
      "Overdue detection at a glance",
      "Payment tracking without a gateway",
    ],
  },
  {
    icon: Building2,
    title: "Clients",
    description:
      "Maintain your client list and their contact details so billing stays consistent and repeatable.",
    points: [
      "Central client directory",
      "Reusable contact details",
      "Consistent billing records",
      "Per-client invoice history",
    ],
  },
  {
    icon: Package,
    title: "Products & services",
    description:
      "Catalogue the items and services you sell and reuse them across invoices.",
    points: [
      "Reusable product catalogue",
      "Prices and descriptions on hand",
      "Add items to invoices in clicks",
      "No re-typing the same line items",
    ],
  },
  {
    icon: Users,
    title: "Your company info",
    description:
      "Configure your company name, number format, contact details and logo — rendered on every invoice.",
    points: [
      "Company profile rendered on invoices",
      "Custom number formats",
      "Contact details and branding",
      "No third-party advertising, ever",
    ],
  },
  {
    icon: ShieldCheck,
    title: "Private by design",
    description:
      "AGPL-3.0 licensed, free to self-host and never phones home. Your data stays on your own hardware.",
    points: [
      "100% open-source and auditable",
      "Self-host anywhere a modern browser lives",
      "No subscriptions, no tracking",
      "No analytics, no third-party ads",
    ],
  },
];

export default function FeaturesPage() {
  return (
    <>
      <section className="mx-auto w-full max-w-6xl px-4 pt-16 pb-4 md:pt-24">
        <div className="mx-auto max-w-2xl text-center">
          <h1 className="text-4xl font-extrabold tracking-tight text-balance sm:text-5xl">
            Everything you need to stay invoiced
          </h1>
          <p className="text-muted-foreground mt-4 text-lg text-pretty">
            A focused feature set, built for one thing: getting you paid on
            time.
          </p>
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-4 py-12">
        <div className="grid gap-4 sm:grid-cols-2">
          {groups.map((g) => (
            <div
              key={g.title}
              className="border-border bg-card flex flex-col gap-4 rounded-2xl border p-6"
            >
              <div className="flex items-center gap-3">
                <span className="bg-primary/10 text-primary inline-flex size-11 shrink-0 items-center justify-center rounded-xl">
                  <g.icon className="size-6" />
                </span>
                <h2 className="text-lg font-semibold">{g.title}</h2>
              </div>
              <p className="text-muted-foreground text-sm text-pretty">
                {g.description}
              </p>
              <ul className="mt-auto space-y-2">
                {g.points.map((p) => (
                  <li
                    key={p}
                    className="text-foreground flex items-start gap-2 text-sm"
                  >
                    <BarChart3 className="text-primary mt-0.5 size-4 shrink-0" />
                    {p}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      <section className="border-border border-t">
        <div className="mx-auto w-full max-w-6xl px-4 py-16 text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            See it running in minutes
          </h2>
          <p className="text-muted-foreground mt-3 max-w-xl text-pretty sm:mx-auto">
            Self-host Cloud Invoice on your own hardware, or look at the source
            to see exactly what it does.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/docs/quickstart"
              className={cn(buttonVariants({ size: "lg" }))}
            >
              Quick start
            </Link>
            <a
              href={GITHUB_REPO_URL}
              target="_blank"
              rel="noopener noreferrer"
              className={cn(buttonVariants({ variant: "outline", size: "lg" }))}
            >
              View on GitHub
            </a>
          </div>
        </div>
      </section>
    </>
  );
}
