"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { pdf } from "@react-pdf/renderer";
import { toast } from "sonner";
import {
  Download,
  FileText,
  MoreHorizontal,
  Plus,
  Search,
  Trash2,
  Users,
  Wallet,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { StatusBadge } from "@/app/components/status-badge";
import { InvoiceDocument } from "@/app/components/invoice-document";
import { useClients, useInvoices } from "@/lib/storage";
import { computeTotals, formatDateLong, formatMoney } from "@/lib/totals";
import { computeStatus } from "@/lib/invoice-status";
import { CURRENCIES } from "@/lib/currency";
import { useCompany } from "@/app/providers/company-provider";
import type { InvoiceData, InvoiceStatus } from "@/lib/types";

const STATUS_FILTERS: { value: InvoiceStatus | "all"; label: string }[] = [
  { value: "all", label: "All statuses" },
  { value: "draft", label: "Draft" },
  { value: "sent", label: "Sent" },
  { value: "partial", label: "Partially paid" },
  { value: "paid", label: "Paid" },
  { value: "overdue", label: "Overdue" },
];

export function Dashboard() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const company = useCompany();
  const { clients } = useClients();
  const { invoices, loaded, removeInvoice } = useInvoices();

  const [query, setQuery] = useState("");
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

  const stats = useMemo(() => {
    const all = invoices.map((inv) => ({ inv, totals: computeTotals(inv) }));
    const outstandingByCurrency = new Map<string, number>();
    const paidByCurrency = new Map<string, number>();
    for (const { inv, totals } of all) {
      if (inv.state === "sent") {
        outstandingByCurrency.set(
          inv.currency,
          (outstandingByCurrency.get(inv.currency) ?? 0) +
            Math.max(totals.balanceDue, 0),
        );
      }
      paidByCurrency.set(
        inv.currency,
        (paidByCurrency.get(inv.currency) ?? 0) + totals.amountPaid,
      );
    }
    return {
      outstandingByCurrency,
      paidByCurrency,
      invoiceCount: invoices.length,
      clientCount: clients.length,
    };
  }, [invoices, clients.length]);

  function renderByCurrency(map: Map<string, number>) {
    const entries = [...map.entries()].filter(([, amount]) => amount !== 0);
    if (entries.length === 0) {
      return <span className="text-xl font-semibold">$0.00</span>;
    }
    return (
      <div className="space-y-0.5">
        {entries.map(([currency, amount]) => (
          <div key={currency} className="text-xl font-semibold">
            {formatMoney(
              amount,
              CURRENCIES[currency as keyof typeof CURRENCIES]?.symbol ??
                currency,
            )}
          </div>
        ))}
      </div>
    );
  }

  async function handleDownload(inv: InvoiceData) {
    const blob = await pdf(
      <InvoiceDocument data={inv} company={company} />,
    ).toBlob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Invoice-${inv.invoiceNumber || "draft"}.pdf`;
    a.click();
    URL.revokeObjectURL(url);
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
    <div className="w-full px-4 py-8 sm:px-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            All invoices for {company.companyName}.
          </p>
        </div>
        <Button nativeButton={false} render={<Link href="/invoices/new" />}>
          <Plus className="size-4" />
          New invoice
        </Button>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-0">
            <CardTitle className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
              <Wallet className="size-3.5" />
              Outstanding
            </CardTitle>
          </CardHeader>
          <CardContent>
            {renderByCurrency(stats.outstandingByCurrency)}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-0">
            <CardTitle className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
              <Wallet className="size-3.5" />
              Received (all time)
            </CardTitle>
          </CardHeader>
          <CardContent>{renderByCurrency(stats.paidByCurrency)}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-0">
            <CardTitle className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
              <FileText className="size-3.5" />
              Invoices
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xl font-semibold">
            {stats.invoiceCount}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-0">
            <CardTitle className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
              <Users className="size-3.5" />
              Clients
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xl font-semibold">
            {stats.clientCount}
          </CardContent>
        </Card>
      </div>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
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
              onClick={() => router.push("/")}
            >
              <X className="size-3" />
            </button>
          </Badge>
        )}
      </div>

      <Card className="mt-4 py-0">
        <CardContent className="p-0">
          <Table className="table-fixed">
            <TableHeader>
              <TableRow>
                <TableHead className="w-32.5">Invoice</TableHead>
                <TableHead>Client</TableHead>
                <TableHead className="w-25">Issued</TableHead>
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
                    colSpan={8}
                    className="h-24 text-center text-muted-foreground"
                  >
                    Loading…
                  </TableCell>
                </TableRow>
              ) : rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="h-32 text-center">
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
                      {formatDateLong(inv.invoiceDate)}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDateLong(inv.dueDate) || "—"}
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
