import {
  BarChart3,
  Building2,
  FileText,
  Package,
  Users,
  Wallet,
} from "lucide-react";

const features = [
  {
    icon: FileText,
    title: "Invoices",
    description:
      "Generate clean, numbered invoices in seconds, mark them paid and keep a permanent record of every document.",
  },
  {
    icon: Wallet,
    title: "Track payments",
    description:
      "See the full lifecycle of each invoice. Draft, sent, paid, overdue; alongside monthly totals at a glance.",
  },
  {
    icon: Building2,
    title: "Clients",
    description:
      "Maintain your client list and their contact details so billing stays consistent and repeatable.",
  },
  {
    icon: Package,
    title: "Products & services",
    description:
      "Catalogue the items and services you sell and reuse them across invoices.",
  },
  {
    icon: Users,
    title: "Your company info",
    description:
      "Cloud Invoice is not a real business, it is a personal project, so it will never advertise inside your invoices.",
  },
  {
    icon: BarChart3,
    title: "Simple by design",
    description:
      "No subscriptions, no tracking, no accounts you don't own. Just invoicing, on your own hardware.",
  },
];

export function Features() {
  return (
    <section id="features" className="border-border bg-card/50 border-t">
      <div className="mx-auto w-full max-w-6xl px-4 py-16 md:py-20">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Everything you need to stay invoiced
          </h2>
          <p className="text-muted-foreground mt-3 text-pretty">
            A focused feature set, built for one thing: getting you paid on
            time.
          </p>
        </div>

        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f) => (
            <div
              key={f.title}
              className="border-border bg-background flex flex-col gap-3 rounded-xl border p-5"
            >
              <span className="bg-primary/10 text-primary inline-flex size-10 items-center justify-center rounded-lg">
                <f.icon className="size-5" />
              </span>
              <h3 className="text-base font-semibold">{f.title}</h3>
              <p className="text-muted-foreground text-sm text-pretty">
                {f.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
