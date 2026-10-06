"use client";

import { useMemo } from "react";
import {
  Banknote,
  FileText,
  History,
  RefreshCw,
  TrendingUp,
  Users,
  UsersRound,
  Wallet,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  Skeleton,
} from "@/components/ui";

import { DoughnutChart } from "@/components/custom/dashboard/doughnut-chart";
import {
  InvoicedReceivedChart,
  type MonthlyPoint,
} from "@/components/custom/dashboard/invoiced-received-chart";
import { useClients, useInvoices } from "@/lib/storage";
import { computeTotals, formatMoney } from "@/lib/totals";
import { computeStatus, STATUS_LABEL } from "@/lib/invoice-status";
import { CURRENCIES } from "@/lib/currency";
import { cn } from "@/lib/utils";
import type { InvoiceStatus, CurrencyCode } from "@/lib/types";

// Theme-aware chart tokens rather than raw hex, so the doughnut follows the
// active theme in both light and dark mode.
const STATUS_CHART_COLOR: Record<InvoiceStatus, string> = {
  draft: "var(--chart-3)",
  sent: "var(--chart-1)",
  partial: "var(--chart-4)",
  paid: "var(--chart-2)",
  overdue: "var(--chart-5)",
};

const STATUS_ORDER: InvoiceStatus[] = [
  "paid",
  "partial",
  "sent",
  "overdue",
  "draft",
];

function monthKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

const CARD_ICON_TONES = {
  amber: "text-amber-500",
  emerald: "text-emerald-500",
  rose: "text-rose-500",
  sky: "text-sky-500",
} as const;

function StatCard({
  icon: Icon,
  tone,
  label,
  value,
  footer,
}: {
  icon: React.ElementType;
  tone: keyof typeof CARD_ICON_TONES;
  label: string;
  value: React.ReactNode;
  footer: React.ReactNode;
}) {
  return (
    <Card>
      <CardContent className="space-y-3 px-5 pt-5 pb-4">
        <div className="flex items-start justify-between gap-3">
          <Icon
            className={cn("size-9 shrink-0", CARD_ICON_TONES[tone])}
            strokeWidth={1.5}
          />
          <div className="min-w-0 flex-1 text-right">
            <p className="text-muted-foreground text-sm font-medium">{label}</p>
            <div className="text-card-foreground truncate text-2xl font-semibold tracking-tight">
              {value}
            </div>
          </div>
        </div>
      </CardContent>
      <CardFooter className="text-muted-foreground items-center gap-1.5 bg-transparent px-5 py-3 text-xs">
        {footer}
      </CardFooter>
    </Card>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span
        className="size-2.5 rounded-full"
        style={{ backgroundColor: color }}
      />
      {label}
    </span>
  );
}

export default function Page() {
  const { clients } = useClients();
  const { invoices, loaded } = useInvoices();

  const dominantCurrency = useMemo<CurrencyCode>(() => {
    let best: CurrencyCode = "USD";
    let bestAmount = -1;
    for (const currency of ["USD", "BDT"] as const) {
      const total = invoices
        .filter((inv) => inv.currency === currency)
        .reduce((sum, inv) => sum + computeTotals(inv).total, 0);
      if (total > bestAmount) {
        best = currency;
        bestAmount = total;
      }
    }
    return best;
  }, [invoices]);

  const monthly = useMemo<MonthlyPoint[]>(() => {
    const months: { key: string; label: string }[] = [];
    const now = new Date();
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push({
        key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`,
        label: d.toLocaleDateString("en-US", { month: "short" }),
      });
    }

    const buckets = new Map(
      months.map((m) => [m.key, { label: m.label, invoiced: 0, received: 0 }]),
    );

    for (const inv of invoices) {
      if (inv.currency !== dominantCurrency) continue;
      const issueBucket = buckets.get(monthKey(new Date(inv.createdAt)));
      if (issueBucket) issueBucket.invoiced += computeTotals(inv).total;
      for (const payment of inv.payments) {
        const payBucket = buckets.get((payment.date || "").slice(0, 7));
        if (payBucket) payBucket.received += Number(payment.amount) || 0;
      }
    }

    return [...buckets.values()];
  }, [invoices, dominantCurrency]);

  const statusBreakdown = useMemo(() => {
    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    const counts = new Map<InvoiceStatus, number>(
      STATUS_ORDER.map((key) => [key, 0]),
    );
    for (const inv of invoices) {
      if (monthKey(new Date(inv.createdAt)) !== currentMonth) continue;
      const status = computeStatus(inv, computeTotals(inv));
      counts.set(status, (counts.get(status) ?? 0) + 1);
    }
    return STATUS_ORDER.map((key) => ({
      key,
      count: counts.get(key) ?? 0,
    }));
  }, [invoices]);

  const symbol = CURRENCIES[dominantCurrency]?.symbol ?? "$";

  const stats = useMemo(() => {
    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    const outstandingByCurrency = new Map<string, number>();
    const paidByCurrency = new Map<string, number>();
    let invoiceCount = 0;
    for (const inv of invoices) {
      const totals = computeTotals(inv);
      if (monthKey(new Date(inv.createdAt)) === currentMonth) {
        invoiceCount += 1;
        if (inv.state === "sent") {
          outstandingByCurrency.set(
            inv.currency,
            (outstandingByCurrency.get(inv.currency) ?? 0) +
              Math.max(totals.balanceDue, 0),
          );
        }
      }
      for (const payment of inv.payments) {
        if ((payment.date || "").slice(0, 7) === currentMonth) {
          paidByCurrency.set(
            inv.currency,
            (paidByCurrency.get(inv.currency) ?? 0) +
              (Number(payment.amount) || 0),
          );
        }
      }
    }
    return {
      outstandingByCurrency,
      paidByCurrency,
      invoiceCount,
      clientCount: clients.length,
    };
  }, [invoices, clients.length]);

  function renderByCurrency(map: Map<string, number>) {
    const currencies: CurrencyCode[] = ["USD", "BDT"];
    return (
      <span className="text-xl font-semibold">
        {currencies
          .map((currency) => {
            const symbol = CURRENCIES[currency].symbol;
            return formatMoney(map.get(currency) ?? 0, symbol).replace(
              symbol,
              `${symbol} `,
            );
          })
          .join(", ")}
      </span>
    );
  }

  return (
    <div className="w-full px-4 py-6 sm:px-6">
      {loaded ? (
        <>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              icon={Wallet}
              tone="sky"
              label="Outstanding"
              value={renderByCurrency(stats.outstandingByCurrency)}
              footer={
                <>
                  <History className="size-3.5" />
                  Outstanding from invoices issued this month
                </>
              }
            />
            <StatCard
              icon={Banknote}
              tone="emerald"
              label="Received"
              value={renderByCurrency(stats.paidByCurrency)}
              footer={
                <>
                  <RefreshCw className="size-3.5" />
                  Payments received this month
                </>
              }
            />
            <StatCard
              icon={FileText}
              tone="amber"
              label="Invoices"
              value={
                <span className="text-2xl font-semibold tracking-tight">
                  {stats.invoiceCount}
                </span>
              }
              footer={
                <>
                  <TrendingUp className="size-3.5" />
                  Invoices issued this month
                </>
              }
            />
            <StatCard
              icon={Users}
              tone="rose"
              label="Clients"
              value={
                <span className="text-2xl font-semibold tracking-tight">
                  {stats.clientCount}
                </span>
              }
              footer={
                <>
                  <UsersRound className="size-3.5" />
                  Clients on file, all time
                </>
              }
            />
          </div>

          <div className="mt-6 grid grid-cols-1 gap-5 md:grid-cols-3">
            <Card>
              <CardHeader className="px-6 pt-6">
                <CardTitle>Invoice Status</CardTitle>
                <CardDescription>This month&apos;s breakdown</CardDescription>
              </CardHeader>
              <CardContent className="flex justify-center px-6 pt-3 pb-2">
                <DoughnutChart
                  data={statusBreakdown.map((s) => ({
                    key: s.key,
                    label: STATUS_LABEL[s.key],
                    value: s.count,
                    color: STATUS_CHART_COLOR[s.key],
                  }))}
                />
              </CardContent>
              <CardFooter className="text-muted-foreground grid grid-cols-2 items-center gap-x-5 gap-y-1.5 bg-transparent px-6 py-3 text-xs">
                {statusBreakdown.map((s) => (
                  <LegendDot
                    key={s.key}
                    color={STATUS_CHART_COLOR[s.key]}
                    label={STATUS_LABEL[s.key]}
                  />
                ))}
              </CardFooter>
            </Card>

            <Card className="md:col-span-2">
              <CardHeader className="px-6 pt-6">
                <CardTitle>Invoiced vs Received</CardTitle>
                <CardDescription>
                  Last 12 months{" "}
                  {monthly.some((m) => m.invoiced > 0 || m.received > 0)
                    ? `· ${symbol}`
                    : ""}
                </CardDescription>
              </CardHeader>
              <CardContent className="px-3 pt-2 pb-2">
                <InvoicedReceivedChart data={monthly} symbol={symbol} />
              </CardContent>
            </Card>
          </div>
        </>
      ) : (
        <div className="flex flex-col gap-5">
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
            {[0, 1, 2, 3].map((i) => (
              <Card key={i}>
                <CardContent className="flex flex-col gap-3">
                  <Skeleton className="size-9 rounded-full" />
                  <Skeleton className="h-4 w-1/2" />
                </CardContent>
              </Card>
            ))}
          </div>
          <div className="mt-5 grid grid-cols-1 gap-5 md:grid-cols-3">
            <Card className="h-64 md:col-span-1">
              <CardHeader>
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-3 w-32" />
              </CardHeader>
              <CardContent className="flex justify-center pt-3 pb-2">
                <Skeleton className="size-40 rounded-full" />
              </CardContent>
            </Card>
            <Card className="h-64 md:col-span-2">
              <CardHeader>
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-24" />
              </CardHeader>
              <CardContent className="flex flex-col gap-3 pt-2">
                {[0, 1, 2, 3, 4].map((i) => (
                  <Skeleton key={i} className="h-6 w-full" />
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
