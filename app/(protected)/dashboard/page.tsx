"use client";

import { Suspense, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import {
  Banknote,
  Download,
  FileText,
  History,
  MoreHorizontal,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  TrendingUp,
  Users,
  UsersRound,
  Wallet,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/custom/shared/status-badge";
import { DoughnutChart } from "@/components/custom/dashboard/doughnut-chart";
import { LineChart } from "@/components/custom/dashboard/line-chart";
import { useClients, useInvoices } from "@/lib/storage";
import {
  computeTotals,
  formatDateLong,
  formatMoney,
  nextInstallmentDueDate,
} from "@/lib/totals";
import { getTemplate } from "@/lib/invoice-templates";
import {
  downloadInstallmentPdf,
  downloadInvoicePdf,
  buildPrintExtras,
  fetchServerNow,
  getUserTimeZone,
} from "@/lib/print-pdf";
import { computeStatus, STATUS_LABEL } from "@/lib/invoice-status";
import { CURRENCIES } from "@/lib/currency";
import { cn } from "@/lib/utils";
import { useCompany } from "@/app/providers/company-provider";
import { usePrintSettings } from "@/hooks/use-print-settings";
import { useTemplateId } from "@/hooks/use-template-id";
import type { InvoiceData, InvoiceStatus, CurrencyCode } from "@/lib/types";

const STATUS_FILTERS: { value: InvoiceStatus | "all"; label: string }[] = [
  { value: "all", label: "All statuses" },
  { value: "draft", label: "Draft" },
  { value: "sent", label: "Sent" },
  { value: "partial", label: "Partially paid" },
  { value: "paid", label: "Paid" },
  { value: "overdue", label: "Overdue" },
];

const STATUS_CHART_COLOR: Record<InvoiceStatus, string> = {
  draft: "#94a3b8",
  sent: "#3b82f6",
  partial: "#f59e0b",
  paid: "#10b981",
  overdue: "#ef4444",
};

const STATUS_ORDER: InvoiceStatus[] = [
  "paid",
  "partial",
  "sent",
  "overdue",
  "draft",
];

const INVOICED_COLOR = "#3b82f6";
const RECEIVED_COLOR = "#10b981";

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
            <p className="text-sm font-medium text-muted-foreground">{label}</p>
            <div className="truncate text-2xl font-semibold tracking-tight text-card-foreground">
              {value}
            </div>
          </div>
        </div>
      </CardContent>
      <CardFooter className="items-center gap-1.5 bg-transparent px-5 py-3 text-xs text-muted-foreground">
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

export default function Home() {
  return (
    <Suspense>
      <DashboardWithQuery />
    </Suspense>
  );
}

function DashboardWithQuery() {
  const searchParams = useSearchParams();
  return <Dashboard key={searchParams.get("q") ?? ""} />;
}

function Dashboard() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const company = useCompany();
  const { settings: printSettings } = usePrintSettings();
  const { templateId } = useTemplateId();
  const { clients } = useClients();
  const { invoices, loaded, removeInvoice } = useInvoices();

  const [query, setQuery] = useState<string>(() => searchParams.get("q") ?? "");
  const [statusFilter, setStatusFilter] = useState<InvoiceStatus | "all">(
    "all",
  );
  const [deleting, setDeleting] = useState<InvoiceData | null>(null);

  const clientId = searchParams.get("clientId");
  const filterClient = clientId ? clients.find((c) => c.id === clientId) : null;

  const clientName = useMemo(() => {
    const map = new Map(clients.map((c) => [c.id, c.name]));
    return (id: string | null) => (id ? (map.get(id) ?? "—") : "—");
  }, [clients]);

  const rows = useMemo(() => {
    return invoices
      .filter((inv) => !clientId || inv.clientId === clientId)
      .map((inv) => ({ inv, totals: computeTotals(inv) }))
      .map((row) => ({ ...row, status: computeStatus(row.inv, row.totals) }))
      .filter((row) => statusFilter === "all" || row.status === statusFilter)
      .filter((row) => {
        const q = query.trim().toLowerCase();
        if (!q) return true;
        return (
          row.inv.invoiceNumber.toLowerCase().includes(q) ||
          row.inv.billToName.toLowerCase().includes(q)
        );
      })
      .sort((a, b) => b.inv.updatedAt.localeCompare(a.inv.updatedAt));
  }, [invoices, clientId, statusFilter, query]);

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

  const monthly = useMemo(() => {
    const months: { key: string; label: string }[] = [];
    const now = new Date();
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push({
        key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`,
        label: d.toLocaleDateString("en-US", { month: "short" }),
      });
    }

    const invoiced = new Map(
      months.map((m) => [m.key, { label: m.label, value: 0 }]),
    );
    const received = new Map(
      months.map((m) => [m.key, { label: m.label, value: 0 }]),
    );

    for (const inv of invoices) {
      if (inv.currency !== dominantCurrency) continue;
      const issueKey = inv.createdAt.slice(0, 7);
      const issueBucket = invoiced.get(issueKey);
      if (issueBucket) issueBucket.value += computeTotals(inv).total;
      for (const payment of inv.payments) {
        const payKey = (payment.date || "").slice(0, 7);
        const payBucket = received.get(payKey);
        if (payBucket) payBucket.value += Number(payment.amount) || 0;
      }
    }

    return {
      invoiced: [...invoiced.values()],
      received: [...received.values()],
    };
  }, [invoices, dominantCurrency]);

  const statusBreakdown = useMemo(() => {
    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    const counts = new Map<InvoiceStatus, number>(
      STATUS_ORDER.map((key) => [key, 0]),
    );
    for (const inv of invoices) {
      if (inv.createdAt.slice(0, 7) !== currentMonth) continue;
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
      if (inv.createdAt.slice(0, 7) === currentMonth) {
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

  async function handleDownload(inv: InvoiceData) {
    try {
      const printDate = await fetchServerNow();
      const timeZone = getUserTimeZone();
      const template = getTemplate(templateId);
      await downloadInvoicePdf(
        template.markup(inv, {
          realTable: true,
          headerMode: printSettings.headerMode,
          footerMode: printSettings.footerMode,
          company,
          printDate,
          timeZone,
        }),
        `${inv.invoiceNumber || "invoice"}.pdf`,
        buildPrintExtras(
          printSettings,
          inv,
          company,
          printDate,
          timeZone,
          template,
        ),
      );
    } catch {
      toast.error("Failed to generate PDF");
    }
  }

  async function handleDownloadInstallments(inv: InvoiceData) {
    if (!inv.installmentsEnabled || inv.installments.length === 0) return;
    try {
      const template = getTemplate(templateId);
      for (const installment of inv.installments) {
        await downloadInstallmentPdf(
          inv,
          installment,
          company,
          printSettings,
          template,
        );
      }
    } catch {
      toast.error("Failed to generate installment PDFs");
    }
  }

  async function confirmDelete() {
    if (!deleting) return;
    try {
      await removeInvoice(deleting.id);
      toast.success("Invoice deleted");
    } catch {
      toast.error("Failed to delete invoice");
    }
    setDeleting(null);
  }

  const symbolForRow = (currency: InvoiceData["currency"]) =>
    CURRENCIES[currency]?.symbol ?? "$";

  return (
    <div className="w-full px-4 py-6 sm:px-6">
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
                label: STATUS_LABEL[s.key],
                value: s.count,
                color: STATUS_CHART_COLOR[s.key],
              }))}
            />
          </CardContent>
          <CardFooter className="grid grid-cols-2 items-center gap-x-5 gap-y-1.5 bg-transparent px-6 py-3 text-xs text-muted-foreground">
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
              {monthly.invoiced.some((m) => m.value > 0) ? `· ${symbol}` : ""}
            </CardDescription>
          </CardHeader>
          <CardContent className="px-3 pb-2 pt-2">
            <LineChart
              series={[
                {
                  name: "Invoiced",
                  color: INVOICED_COLOR,
                  points: monthly.invoiced,
                },
                {
                  name: "Received",
                  color: RECEIVED_COLOR,
                  points: monthly.received,
                },
              ]}
            />
          </CardContent>
          <CardFooter className="items-center gap-5 bg-transparent px-6 py-3 text-xs text-muted-foreground">
            <LegendDot color={INVOICED_COLOR} label="Invoiced" />
            <LegendDot color={RECEIVED_COLOR} label="Received" />
          </CardFooter>
        </Card>
      </div>

      <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by invoice # or client…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-8"
          />
        </div>
        <Select
          value={statusFilter}
          onValueChange={(v) => setStatusFilter(v as InvoiceStatus | "all")}
        >
          <SelectTrigger className="w-full sm:w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {STATUS_FILTERS.map((f) => (
              <SelectItem key={f.value} value={f.value}>
                {f.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {filterClient && (
          <Badge variant="secondary" className="gap-1.5 py-1.5 pl-2.5 pr-1.5">
            Client: {filterClient.name}
            <button
              type="button"
              className="rounded-full p-0.5 hover:bg-foreground/10"
              onClick={() => router.push("/dashboard")}
            >
              <X className="size-3" />
            </button>
          </Badge>
        )}
        <div className="sm:ml-auto">
          <Button nativeButton={false} render={<Link href="/invoices/new" />}>
            <Plus className="size-4" />
            New invoice
          </Button>
        </div>
      </div>

      <Card className="mt-4 py-0">
        <CardContent className="p-0">
          <Table className="table-fixed">
            <TableHeader>
              <TableRow>
                <TableHead className="w-32.5">Invoice</TableHead>
                <TableHead>Client</TableHead>
                <TableHead className="w-25">Due</TableHead>
                <TableHead className="w-27.5 text-right">Total</TableHead>
                <TableHead className="w-30 text-right">Balance due</TableHead>
                <TableHead className="w-30">Status</TableHead>
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {!loaded ? (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="h-24 text-center text-muted-foreground"
                  >
                    Loading…
                  </TableCell>
                </TableRow>
              ) : rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-32 text-center">
                    <div className="flex flex-col items-center gap-2 text-muted-foreground">
                      <FileText className="size-8" />
                      <p>
                        {invoices.length === 0
                          ? "No invoices yet."
                          : "No invoices match your filters."}
                      </p>
                      {invoices.length === 0 && (
                        <Button
                          size="sm"
                          className="mt-1"
                          nativeButton={false}
                          render={<Link href="/invoices/new" />}
                        >
                          <Plus className="size-4" />
                          Create your first invoice
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                rows.map(({ inv, totals, status }) => (
                  <TableRow
                    key={inv.id}
                    className="cursor-pointer"
                    onClick={() => router.push(`/invoices/${inv.id}`)}
                  >
                    <TableCell className="truncate font-medium">
                      {inv.invoiceNumber || "(no number)"}
                    </TableCell>
                    <TableCell className="truncate text-muted-foreground">
                      {inv.billToName || clientName(inv.clientId)}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {inv.installmentsEnabled && inv.installments.length > 0
                        ? formatDateLong(nextInstallmentDueDate(inv)) || "—"
                        : formatDateLong(inv.dueDate) || "—"}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatMoney(totals.total, symbolForRow(inv.currency))}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatMoney(
                        totals.balanceDue,
                        symbolForRow(inv.currency),
                      )}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={status} />
                    </TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <DropdownMenu>
                        <DropdownMenuTrigger
                          render={
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-8"
                            />
                          }
                        >
                          <MoreHorizontal className="size-4" />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            render={<Link href={`/invoices/${inv.id}`} />}
                          >
                            Open
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDownload(inv)}>
                            <Download className="size-4" />
                            Download PDF
                          </DropdownMenuItem>
                          {inv.installmentsEnabled &&
                            inv.installments.length > 0 && (
                              <DropdownMenuItem
                                onClick={() => handleDownloadInstallments(inv)}
                              >
                                <Download className="size-4" />
                                Download installment PDFs
                              </DropdownMenuItem>
                            )}
                          <DropdownMenuItem
                            variant="destructive"
                            onClick={() => setDeleting(inv)}
                          >
                            <Trash2 className="size-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <AlertDialog
        open={!!deleting}
        onOpenChange={(o) => !o && setDeleting(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Delete invoice {deleting?.invoiceNumber || "(no number)"}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This permanently removes the invoice and its payment history. This
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
