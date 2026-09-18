import { Badge } from "@site/components/ui/badge";

const stats = [
  { label: "Invoices sent", value: "24" },
  { label: "Paid this month", value: "$8,120.00" },
  { label: "Pending", value: "$2,340.00" },
];

export function Hero() {
  return (
    <section className="mx-auto w-full max-w-6xl px-4 pt-16 pb-12 md:pt-24">
      <div className="mx-auto max-w-2xl text-center">
        <Badge variant="outline" className="mb-4">
          Open-source · AGPL-3.0 · Self-hostable
        </Badge>
        <h1 className="text-4xl font-extrabold tracking-tight text-balance sm:text-5xl md:text-6xl">
          Cloud Invoice
          <span className="text-primary block">by Nexaus</span>
        </h1>
        <p className="text-muted-foreground mt-4 text-lg text-pretty">
          Create invoices, manage clients and products, and track every payment
          from one clean dashboard; with your data fully under your control.
        </p>
      </div>

      <div className="relative mx-auto mt-14 max-w-3xl">
        <div className="bg-primary/10 absolute -inset-x-4 -top-10 -bottom-10 rounded-[2.5rem] blur-3xl sm:-inset-x-8" />
        <div className="border-border bg-card relative rounded-2xl border p-4 shadow-xl sm:p-6">
          <div className="mb-4 flex items-center justify-between">
            <p className="text-muted-foreground text-sm font-semibold tracking-wide">
              nci · Cloud Invoice
            </p>
            <div className="flex items-center gap-1">
              <span className="size-2.5 rounded-full bg-rose-500" />
              <span className="size-2.5 rounded-full bg-amber-500" />
              <span className="size-2.5 rounded-full bg-emerald-500" />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            {stats.map((s) => (
              <div
                key={s.label}
                className="border-border bg-background rounded-xl border p-4"
              >
                <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
                  {s.label}
                </p>
                <p className="mt-1 text-xl font-bold tracking-tight">
                  {s.value}
                </p>
              </div>
            ))}
          </div>
          <div className="border-border bg-background mt-4 rounded-xl border p-4">
            <p className="text-muted-foreground mb-3 text-xs font-medium tracking-wide uppercase">
              Recent invoices
            </p>
            <div className="space-y-2">
              {[
                ["INV-2025-014", "Acme Studio", "Paid", "text-emerald-600"],
                ["INV-2025-015", "Northwind GmbH", "Pending", "text-amber-600"],
                ["INV-2025-016", "Lumen Labs", "Overdue", "text-rose-600"],
              ].map(([no, client, status, color]) => (
                <div
                  key={no}
                  className="border-border flex items-center justify-between rounded-lg border px-3 py-2 text-sm"
                >
                  <span className="text-muted-foreground font-mono text-xs">
                    {no}
                  </span>
                  <span className="font-medium">{client}</span>
                  <span className={`text-xs font-semibold ${color}`}>
                    {status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
