import { ArrowUpRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import SectionTitle from "../SectionTitle";
import { featuresData } from "../data/features";
import { IFeature } from "../types";

export default function FeaturesSection() {
  return (
    <div id="features" className="w-full">
      <SectionTitle
        text1="Features"
        text2="Everything invoicing needs, nothing else"
        text3="Invoices, payment schedules, clients and a product catalogue with the PDF generated in your browser."
      />
      <div className="mt-16 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {featuresData.map((feature: IFeature, index: number) => (
          <div
            key={feature.title}
            className={`${
              index === 1
                ? "rounded-[13px] bg-linear-to-br from-teal-600 to-slate-800 p-px dark:to-slate-800"
                : ""
            }`}
          >
            <div className="border-border bg-card text-card-foreground h-full space-y-4 rounded-xl border p-6">
              {feature.icon}
              <h3 className="text-base font-medium">{feature.title}</h3>
              <p className="text-muted-foreground pb-4">
                {feature.description}
              </p>
            </div>
          </div>
        ))}
      </div>
      <div className="relative mt-40 w-full">
        <div className="pointer-events-none absolute -top-10 left-1/2 -z-50 aspect-square size-100 -translate-x-1/2 rounded-full bg-teal-500/30 blur-3xl dark:bg-teal-500/40"></div>
        <p className="text-muted-foreground max-w-3xl text-left text-lg text-pretty">
          Payment schedules split an invoice into installments by amount or
          percentage. Payments are applied to the oldest unpaid installment
          first, so the balance is always right.
        </p>
        <div className="mt-8 grid gap-10 md:grid-cols-3">
          <div className="md:col-span-2">
            <Image
              className="h-auto w-full"
              src="/assets/features-showcase-1.png"
              alt="Placeholder screenshot — replace with a real Cloud Invoice installment schedule capture"
              width={1017}
              height={678}
            />
          </div>
          <div className="md:col-span-1">
            <Image
              className="h-auto w-full"
              src="/assets/features-showcase-2.png"
              alt="Placeholder screenshot — replace with a real Cloud Invoice dashboard capture"
              width={646}
              height={546}
            />
            <h3 className="text-foreground mt-6 text-[24px]/7.5 font-medium">
              Your dashboard, not ours
            </h3>
            <p className="text-muted-foreground mt-2 text-pretty">
              Outstanding, received, invoice count and client count computed
              from your own database.
            </p>
            <Link
              href="/features"
              className="text-primary hover:text-primary/80 group mt-4 flex items-center gap-2"
            >
              See the full feature list
              <ArrowUpRight className="size-5" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
