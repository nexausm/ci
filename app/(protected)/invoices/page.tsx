"use client";

import { Suspense, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import {
  Download,
  FileText,
  MoreHorizontal,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  Badge,
  Button,
  Card,
  CardContent,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui";

import { StatusBadge } from "@/components/custom/shared/status-badge";
import { useClients, useInvoices } from "@/lib/storage";
import {
  computeTotals,
  formatDateLong,
  formatMoney,
  nextInstallmentDueDate,
} from "@/lib/totals";
import { getTemplate } from "@/lib/invoice-templates";
import {
  buildPrintExtras,
  downloadInstallmentPdf,
  downloadInvoicePdf,
  fetchServerNow,
  getUserTimeZone,
} from "@/lib/print-pdf";
import { computeStatus } from "@/lib/invoice-status";
import { CURRENCIES } from "@/lib/currency";
import { useCompany } from "@/app/providers/company-provider";
import { usePrintSettings } from "@/hooks/use-print-settings";
import { useTemplateId } from "@/hooks/use-template-id";
import type { InvoiceData, InvoiceStatus } from "@/lib/types";

const STATUS_FILTERS: { value: InvoiceStatus | "all"; label: string }[] = [
  { value: "all", label: "All statuses" },
  { value: "draft", label: "Draft" },
  { value: "sent", label: "Sent" },
  { value: "partial", label: "Partially paid" },
  { value: "paid", label: "Paid" },
  { value: "overdue", label: "Overdue" },
];

export default function Page() {
  return (
    <Suspense>
      <InvoiceList />
    </Suspense>
  );
}

function InvoiceList() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const company = useCompany();
  const { settings: printSettings } = usePrintSettings();
  const { templateId } = useTemplateId();
  const { clients } = useClients();
  const { invoices, loaded, removeInvoice } = useInvoices();

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
      .sort((a, b) => b.inv.updatedAt.localeCompare(a.inv.updatedAt));
  }, [invoices, clientId, statusFilter]);

  const symbolForRow = (currency: InvoiceData["currency"]) =>
    CURRENCIES[currency]?.symbol ?? "$";

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

  return (
    <div className="w-full px-4 py-8 sm:px-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Invoices</h1>
          <p className="text-muted-foreground text-sm">
            Everything you have billed, newest first.
          </p>
        </div>
        <Button nativeButton={false} render={<Link href="/invoices/new" />}>
          <Plus className="size-4" />
          New invoice
        </Button>
      </div>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
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
          <Badge variant="secondary" className="gap-1.5 py-1.5 pr-1.5 pl-2.5">
            Client: {filterClient.name}
            <button
              type="button"
              className="hover:bg-foreground/10 rounded-full p-0.5"
              onClick={() => router.push("/invoices")}
              aria-label="Clear client filter"
            >
              <X className="size-3" />
            </button>
          </Badge>
        )}
        <p className="text-muted-foreground text-sm tabular-nums sm:ml-auto">
          {loaded ? `${rows.length} of ${invoices.length}` : " "}
        </p>
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
                  <TableCell colSpan={7} className="h-24">
                    <Skeleton className="h-6 w-full" />
                  </TableCell>
                </TableRow>
              ) : rows.length === 0 ? (
                <TableRow className="hover:bg-transparent">
                  <TableCell colSpan={7}>
                    <Empty>
                      <EmptyHeader>
                        <EmptyMedia variant="icon">
                          <FileText />
                        </EmptyMedia>
                        <EmptyTitle>
                          {invoices.length === 0
                            ? "No invoices yet"
                            : "No matching invoices"}
                        </EmptyTitle>
                        <EmptyDescription>
                          {invoices.length === 0
                            ? "Create your first invoice to start tracking what you are owed."
                            : "Try a different status filter."}
                        </EmptyDescription>
                      </EmptyHeader>
                      {invoices.length === 0 && (
                        <EmptyContent>
                          <Button
                            variant="outline"
                            nativeButton={false}
                            render={<Link href="/invoices/new" />}
                          >
                            <Plus data-icon="inline-start" />
                            Create your first invoice
                          </Button>
                        </EmptyContent>
                      )}
                    </Empty>
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
                    <TableCell className="text-muted-foreground truncate">
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
                          <span className="sr-only">Open menu</span>
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
