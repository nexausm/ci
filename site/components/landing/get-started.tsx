import { ArrowRight, KeyRound, Plane, Rocket } from "lucide-react";
import Link from "next/link";

import { Badge } from "@site/components/ui/badge";

const steps = [
  {
    icon: KeyRound,
    title: "Create your account",
    description:
      "Cloud Invoice runs a small demo you can try right away with your own seeded user.",
  },
  {
    icon: Plane,
    title: "Add your details",
    description:
      "Set your company name and then start adding clients, products, and services.",
  },
  {
    icon: Rocket,
    title: "Create & send invoices",
    description:
      "Draft an invoice in a couple of clicks, mark it paid when the money lands, and watch your totals update.",
  },
];

export function GetStarted() {
  return (
    <section id="getting-started" className="border-border border-t">
      <div className="mx-auto w-full max-w-6xl px-4 py-16 md:py-20">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Up and running in minutes
          </h2>
          <p className="text-muted-foreground mt-3 text-pretty">
            No forms to sign up for, no credit card. Just run it or use the
            demo.
          </p>
        </div>

        <div className="mt-12 grid gap-4 md:grid-cols-3">
          {steps.map((s, i) => (
            <div
              key={s.title}
              className="border-border bg-card relative flex flex-col gap-3 rounded-xl border p-6"
            >
              <span className="bg-primary/10 text-primary inline-flex size-10 items-center justify-center rounded-lg">
                <s.icon className="size-5" />
              </span>
              <p className="text-primary text-xs font-bold tracking-widest uppercase">
                Step {i + 1}
              </p>
              <h3 className="text-base font-semibold">{s.title}</h3>
              <p className="text-muted-foreground text-sm text-pretty">
                {s.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
