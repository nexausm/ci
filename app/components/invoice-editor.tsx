"use client";

import { useDeferredValue, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { pdf } from "@react-pdf/renderer";
import { toast } from "sonner";
import {
  ArrowLeft,
  Building2,
  Download,
  Loader2,
  Plus,
  Trash2,
  User,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { cn } from "@/lib/utils";
import { InvoiceDocument } from "@/app/components/invoice-document";
import { PaymentsSection } from "@/app/components/payments-section";
import { ClientPicker } from "@/app/components/client-picker";
import { StatusBadge } from "@/app/components/status-badge";
import { useClients, useInvoices, fetchInvoiceById } from "@/lib/storage";
import { createDefaultInvoice, newItem } from "@/lib/defaults";
import { computeTotals, formatMoney } from "@/lib/totals";
import { computeStatus } from "@/lib/invoice-status";
import { CURRENCIES } from "@/lib/currency";
import { useCompany } from "@/app/providers/company-provider";
import type { Client, CurrencyCode, InvoiceData } from "@/lib/types";

const PDFViewer = dynamic(
  () =>
    import("@/app/components/invoice-preview").then((m) => m.InvoicePreview),
  { ssr: false },
);

function Field({
  label,
  htmlFor,
  children,
}: {
  label: string;
  htmlFor?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
    </div>
  );
}

export function InvoiceEditor({ id }: { id?: string }) {
  const router = useRouter();
  const company = useCompany();
  const { clients, upsertClient } = useClients();
  const { upsertInvoice, removeInvoice } = useInvoices();

  const mode: "new" | "edit" = id ? "edit" : "new";
  const [data, setData] = useState<InvoiceData | null>(() =>
    id ? null : createDefaultInvoice(),
  );
  const [notFound, setNotFound] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    fetchInvoiceById(id).then((found) => {
      if (cancelled) return;
      if (found) setData(found);
      else setNotFound(true);
    });
    return () => {
      cancelled = true;
    };
  }, [id]);

  const deferredData = useDeferredValue(data);
  const totals = data ? computeTotals(data) : null;
  const symbol = data ? (CURRENCIES[data.currency]?.symbol ?? "$") : "$";
  const status = data && totals ? computeStatus(data, totals) : "draft";

  function update(patch: Partial<InvoiceData>) {
    setData((d) => (d ? { ...d, ...patch } : d));
  }

  function updateItem(
    itemId: string,
    patch: Partial<InvoiceData["items"][number]>,
  ) {
    setData((d) =>
      d
        ? {
            ...d,
            items: d.items.map((it) =>
              it.id === itemId ? { ...it, ...patch } : it,
            ),
          }
        : d,
    );
  }

  function addItem() {
    setData((d) => (d ? { ...d, items: [...d.items, newItem()] } : d));
  }

  function removeItem(itemId: string) {
    setData((d) =>
      d ? { ...d, items: d.items.filter((it) => it.id !== itemId) } : d,
    );
  }

  function selectClient(client: Client) {
    update({
      clientId: client.id,
      billToType: client.type,
      billToName: client.name,
      billToContactName: client.contactName,
      billToAddress: client.addressLines.join("\n"),
      billToPhone: client.phone,
      billToEmail: client.email,
    });
  }

  async function handleSave() {
    if (!data) return;
    setSaving(true);
    try {
      const toSave: InvoiceData = {
        ...data,
        updatedAt: new Date().toISOString(),
      };
      upsertInvoice(toSave);
      setData(toSave);
      toast.success("Invoice saved");
      if (mode === "new") {
        router.replace(`/invoices/${toSave.id}`);
      }
    } finally {
      setSaving(false);
    }
  }

  async function handleDownload() {
    if (!data) return;
    setDownloading(true);
    try {
      const blob = await pdf(
        <InvoiceDocument data={data} company={company} />,
      ).toBlob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Invoice-${data.invoiceNumber || "draft"}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setDownloading(false);
    }
  }

  function handleDelete() {
    if (!data) return;
    removeInvoice(data.id);
    toast.success("Invoice deleted");
    router.push("/");
  }

  if (notFound) {
    return (
      <div className="mx-auto max-w-xl px-6 py-24 text-center">
        <h1 className="text-lg font-semibold">Invoice not found</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          It may have been deleted, or the link is incorrect.
        </p>
        <Button
          className="mt-6"
          nativeButton={false}
          render={<Link href="/" />}
        >
          Back to dashboard
        </Button>
      </div>
    );
  }

  if (!data || !totals) {
    return (
      <div className="mx-auto max-w-7xl px-6 py-24 text-center text-sm text-muted-foreground">
        Loading invoice…
      </div>
    );
  }

  return (
    <div className="flex flex-col lg:h-full">
      <div className="flex shrink-0 flex-wrap items-center justify-between gap-4 border-b px-4 py-4 sm:px-6">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            className="size-8"
            nativeButton={false}
            render={<Link href="/" />}
          >
            <ArrowLeft className="size-4" />
          </Button>
          <div>
            <div className="flex items-center gap-2 text-sm font-medium">
              {mode === "new"
                ? "New invoice"
                : data.invoiceNumber || "Untitled invoice"}
              <StatusBadge status={status} />
            </div>
            {data.billToName && (
              <div className="text-xs text-muted-foreground">
                Billed to {data.billToName}
              </div>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {mode === "edit" && (
            <Button
              variant="outline"
              size="sm"
              className="text-destructive hover:text-destructive"
              onClick={() => setDeleteOpen(true)}
            >
              <Trash2 className="size-4" />
              <span className="hidden sm:inline">Delete</span>
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={handleDownload}
            disabled={downloading}
          >
            {downloading ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Download className="size-4" />
            )}
            <span className="hidden sm:inline">Download PDF</span>
          </Button>
          <Button size="sm" onClick={handleSave} disabled={saving}>
            {saving && <Loader2 className="size-4 animate-spin" />}
            Save invoice
          </Button>
        </div>
      </div>

      <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
        <div className="space-y-6 p-4 sm:p-6 lg:min-h-0 lg:flex-1 lg:overflow-y-auto">
          <Card>
            <CardHeader>
              <CardTitle>Invoice details</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <Field label="Invoice number" htmlFor="invoiceNumber">
                <Input
                  id="invoiceNumber"
                  value={data.invoiceNumber}
                  onChange={(e) => update({ invoiceNumber: e.target.value })}
                  placeholder="INV-0001"
                />
              </Field>
              <Field label="Date" htmlFor="invoiceDate">
                <Input
                  id="invoiceDate"
                  type="date"
                  value={data.invoiceDate}
                  onChange={(e) => update({ invoiceDate: e.target.value })}
                />
              </Field>
              <Field label="Due date" htmlFor="dueDate">
                <Input
                  id="dueDate"
                  type="date"
                  value={data.dueDate}
                  onChange={(e) => update({ dueDate: e.target.value })}
                />
              </Field>
              <Field label="Currency" htmlFor="currency">
                <Select
                  value={data.currency}
                  onValueChange={(v) => update({ currency: v as CurrencyCode })}
                >
                  <SelectTrigger id="currency" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(CURRENCIES).map(([code, info]) => (
                      <SelectItem key={code} value={code}>
                        {info.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>

              <div className="col-span-2 flex items-center gap-2 sm:col-span-4">
                <Switch
                  id="invoiceState"
                  checked={data.state === "sent"}
                  onCheckedChange={(checked) =>
                    update({ state: checked ? "sent" : "draft" })
                  }
                />
                <Label htmlFor="invoiceState" className="font-normal">
                  Mark as sent (uncheck to keep as draft)
                </Label>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Bill to</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Field label="Client">
                <ClientPicker
                  clients={clients}
                  value={data.clientId}
                  onSelect={selectClient}
                  onCreateClient={upsertClient}
                />
              </Field>

              <div className="grid grid-cols-2 gap-2">
                {(
                  [
                    { value: "individual", label: "Individual", icon: User },
                    {
                      value: "organization",
                      label: "Organization",
                      icon: Building2,
                    },
                  ] as const
                ).map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => update({ billToType: opt.value })}
                    className={cn(
                      "flex items-center justify-center gap-2 rounded-md border px-3 py-1.5 text-sm font-medium transition-colors",
                      data.billToType === opt.value
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-input hover:bg-accent",
                    )}
                  >
                    <opt.icon className="size-4" />
                    {opt.label}
                  </button>
                ))}
              </div>

              <Field label="Name">
                <Input
                  value={data.billToName}
                  onChange={(e) => update({ billToName: e.target.value })}
                  placeholder={
                    data.billToType === "organization"
                      ? "Acme Inc."
                      : "Client name"
                  }
                />
              </Field>

              {data.billToType === "organization" && (
                <Field label="Contact person (optional)">
                  <Input
                    value={data.billToContactName}
                    onChange={(e) =>
                      update({ billToContactName: e.target.value })
                    }
                    placeholder="Attn: John Smith"
                  />
                </Field>
              )}

              <div className="grid grid-cols-2 gap-3">
                <Field label="Email">
                  <Input
                    type="email"
                    value={data.billToEmail}
                    onChange={(e) => update({ billToEmail: e.target.value })}
                  />
                </Field>
                <Field label="Phone">
                  <Input
                    value={data.billToPhone}
                    onChange={(e) => update({ billToPhone: e.target.value })}
                  />
                </Field>
              </div>

              <Field label="Address (one line per row)">
                <Textarea
                  rows={2}
                  value={data.billToAddress}
                  onChange={(e) => update({ billToAddress: e.target.value })}
                />
              </Field>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex-row items-center justify-between space-y-0">
              <CardTitle>Line items</CardTitle>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addItem}
              >
                <Plus className="size-4" />
                Add item
              </Button>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="hidden grid-cols-[1fr_96px_64px_96px_32px] gap-2 px-1 text-xs font-medium text-muted-foreground sm:grid">
                <span>Description</span>
                <span className="text-right">Rate</span>
                <span className="text-right">Qty</span>
                <span className="text-right">Amount</span>
                <span />
              </div>
              {data.items.map((item) => (
                <div
                  key={item.id}
                  className="grid grid-cols-2 gap-2 rounded-md border p-2 sm:grid-cols-[1fr_96px_64px_96px_32px] sm:items-center sm:border-none sm:p-0"
                >
                  <Input
                    className="col-span-2 sm:col-span-1"
                    placeholder="Description"
                    value={item.description}
                    onChange={(e) =>
                      updateItem(item.id, { description: e.target.value })
                    }
                  />
                  <Input
                    type="number"
                    className="text-right"
                    placeholder="Rate"
                    value={item.rate}
                    onChange={(e) =>
                      updateItem(item.id, { rate: Number(e.target.value) })
                    }
                  />
                  <Input
                    type="number"
                    className="text-right"
                    placeholder="Qty"
                    value={item.qty}
                    onChange={(e) =>
                      updateItem(item.id, { qty: Number(e.target.value) })
                    }
                  />
                  <div className="flex items-center justify-end text-sm font-medium">
                    {formatMoney(
                      (Number(item.rate) || 0) * (Number(item.qty) || 0),
                      symbol,
                    )}
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="size-8 justify-self-end text-muted-foreground hover:text-destructive"
                    onClick={() => removeItem(item.id)}
                    disabled={data.items.length === 1}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Adjustments</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <Switch
                  id="discountEnabled"
                  checked={data.discountEnabled}
                  onCheckedChange={(checked) =>
                    update({ discountEnabled: checked })
                  }
                />
                <Label htmlFor="discountEnabled" className="font-normal">
                  Discount
                </Label>
                {data.discountEnabled && (
                  <Input
                    type="number"
                    aria-label="Discount amount"
                    className="w-32"
                    value={data.discountValue}
                    onChange={(e) =>
                      update({ discountValue: Number(e.target.value) })
                    }
                  />
                )}
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <Switch
                  id="taxEnabled"
                  checked={data.taxEnabled}
                  onCheckedChange={(checked) => update({ taxEnabled: checked })}
                />
                <Label htmlFor="taxEnabled" className="font-normal">
                  Tax
                </Label>
                {data.taxEnabled && (
                  <>
                    <Input
                      className="w-32"
                      value={data.taxLabel}
                      onChange={(e) => update({ taxLabel: e.target.value })}
                      placeholder="Tax label"
                    />
                    <Input
                      type="number"
                      aria-label="Tax amount"
                      className="w-32"
                      value={data.taxValue}
                      onChange={(e) =>
                        update({ taxValue: Number(e.target.value) })
                      }
                    />
                  </>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <PaymentsSection
                payments={data.payments}
                currencySymbol={symbol}
                onChange={(payments) => update({ payments })}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Notes</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                rows={3}
                value={data.notes}
                onChange={(e) => update({ notes: e.target.value })}
                placeholder="Payment terms, thank-you note, bank details…"
              />
            </CardContent>
          </Card>

          <Card>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span>{formatMoney(totals.subtotal, symbol)}</span>
              </div>
              {data.discountEnabled && totals.discount !== 0 && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Discount</span>
                  <span>-{formatMoney(totals.discount, symbol)}</span>
                </div>
              )}
              {data.taxEnabled && totals.tax !== 0 && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    {data.taxLabel || "Tax"}
                  </span>
                  <span>{formatMoney(totals.tax, symbol)}</span>
                </div>
              )}
              <Separator className="my-2" />
              <div className="flex justify-between font-medium">
                <span>Total</span>
                <span>{formatMoney(totals.total, symbol)}</span>
              </div>
              {totals.amountPaid > 0 && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Amount paid</span>
                  <span>-{formatMoney(totals.amountPaid, symbol)}</span>
                </div>
              )}
              <Separator className="my-2" />
              <div className="flex justify-between text-base font-semibold">
                <span>Balance due</span>
                <span>{formatMoney(totals.balanceDue, symbol)}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="h-150 w-full bg-muted p-4 lg:h-full lg:w-auto lg:flex-none">
          <div className="mx-auto h-full aspect-210/297 overflow-hidden shadow-2xl shadow-black/10 ring-1 ring-black/5">
            <PDFViewer>
              <InvoiceDocument data={deferredData ?? data} company={company} />
            </PDFViewer>
          </div>
        </div>
      </div>

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this invoice?</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently removes the invoice and its payment history. This
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
