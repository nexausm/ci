"use client";

import { useDeferredValue, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { toast } from "sonner";
import { Download, Loader2, Plus, Settings2, Trash2 } from "lucide-react";
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
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "@/components/ui/popover";
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
import { InstallmentsSection } from "@/components/custom/invoice/installments-section";
import { PaymentsSection } from "@/components/custom/invoice/payments-section";
import { ReferencesSection } from "@/components/custom/invoice/references-section";
import { ClientPicker } from "@/components/custom/client/picker";
import { ProductPicker } from "@/components/custom/product/picker";
import { SignedNumberInput } from "@/components/custom/shared/signed-number-input";
import {
  useClients,
  useInvoices,
  useProducts,
  fetchInvoiceById,
} from "@/lib/storage";
import { createDefaultInvoice, newItem, productPriceFor } from "@/lib/defaults";
import { genId } from "@/lib/id";
import { invoiceMarkup } from "@/lib/invoice-markup";
import { downloadInvoicePdf, buildPrintExtras } from "@/lib/print-pdf";
import { computeTotals, formatMoney } from "@/lib/totals";
import { CURRENCIES } from "@/lib/currency";
import { useCompany } from "@/app/providers/company-provider";
import { usePrintSettings } from "@/hooks/use-print-settings";
import type { Client, CurrencyCode, InvoiceData, Product } from "@/lib/types";

const PDFViewer = dynamic(
  () =>
    import("@/components/custom/invoice/preview").then((m) => m.InvoicePreview),
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
  const { settings: printSettings, update: updatePrintSettings } =
    usePrintSettings();
  const { clients } = useClients();
  const { products } = useProducts();
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

  const totals = data ? computeTotals(data) : null;
  const symbol = data ? (CURRENCIES[data.currency]?.symbol ?? "$") : "$";

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

  function addProductItem(product: Product) {
    const { base, rate } = productPriceFor(product, data?.currency ?? "BDT");
    setData((d) =>
      d
        ? {
            ...d,
            items: [
              ...d.items,
              {
                id: genId(),
                productId: product.id,
                description: product.name,
                rate,
                listRate: base,
                qty: 1,
              },
            ],
          }
        : d,
    );
  }

  function changeCurrency(currency: CurrencyCode) {
    setData((d) => {
      if (!d || d.currency === currency) return d;
      const items = d.items.map((item) => {
        if (!item.productId) return item;
        const product = products.find((p) => p.id === item.productId);
        if (!product) return item;
        const { base, rate } = productPriceFor(product, currency);
        return { ...item, rate, listRate: base };
      });
      return { ...d, currency, items };
    });
  }

  function clientToBillTo(client: Client) {
    return {
      billToType: client.type,
      billToName: client.name,
      billToContactName: client.contactName,
      billToAddress: client.addressLines.join("\n"),
      billToPhone: client.phone,
      billToEmail: client.email,
    };
  }

  function selectClient(client: Client) {
    update({ clientId: client.id, ...clientToBillTo(client) });
  }

  const selectedClient = data?.clientId
    ? (clients.find((c) => c.id === data.clientId) ?? null)
    : null;

  const effectiveData = useMemo(() => {
    if (!data) return null;
    if (!selectedClient) return data;
    return { ...data, ...clientToBillTo(selectedClient) };
  }, [data, selectedClient]);

  const deferredData = useDeferredValue(effectiveData);

  async function handleSave() {
    if (!effectiveData) return;
    setSaving(true);
    try {
      const toSave: InvoiceData = {
        ...effectiveData,
        updatedAt: new Date().toISOString(),
      };
      await upsertInvoice(toSave);
      setData(toSave);
      toast.success("Invoice saved");
      if (mode === "new") {
        router.replace(`/invoices/${toSave.id}`);
      }
    } catch {
      toast.error("Failed to save invoice");
    } finally {
      setSaving(false);
    }
  }

  async function handleDownload() {
    if (!effectiveData) return;
    setDownloading(true);
    try {
      const markup = invoiceMarkup(effectiveData, {
        realTable: true,
        headerMode: printSettings.headerMode,
        company,
      });
      const extras = buildPrintExtras(printSettings, effectiveData, company);
      await downloadInvoicePdf(
        markup,
        `${effectiveData.invoiceNumber || "invoice"}.pdf`,
        extras,
      );
    } catch {
      toast.error("Failed to generate PDF");
    } finally {
      setDownloading(false);
    }
  }

  async function handleDelete() {
    if (!effectiveData) return;
    try {
      await removeInvoice(effectiveData.id);
      toast.success("Invoice deleted");
      router.push("/");
    } catch {
      toast.error("Failed to delete invoice");
    }
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

  if (!data || !totals || !effectiveData) {
    return (
      <div className="mx-auto max-w-7xl px-6 py-24 text-center text-sm text-muted-foreground">
        Loading invoice…
      </div>
    );
  }

  return (
    <div className="flex flex-col lg:h-full">
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
                  onValueChange={(v) => changeCurrency(v as CurrencyCode)}
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
            <CardContent>
              <Field label="Client">
                <ClientPicker
                  clients={clients}
                  value={data.clientId}
                  onSelect={selectClient}
                />
              </Field>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex-row items-center justify-between space-y-0">
              <CardTitle>Line items</CardTitle>
              <div className="flex items-center gap-2">
                <ProductPicker
                  products={products}
                  currency={data.currency}
                  onSelect={addProductItem}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addItem}
                >
                  <Plus className="size-4" />
                  Add item
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="hidden grid-cols-[1fr_120px_64px_96px_32px] gap-2 px-1 text-xs font-medium text-muted-foreground sm:grid">
                <span>Description</span>
                <span className="text-right">Rate</span>
                <span className="text-right">Qty</span>
                <span className="text-right">Amount</span>
                <span />
              </div>
              {data.items
                .filter((item) => !item.externalCost)
                .map((item) => {
                  const base = item.listRate ?? item.rate;
                  return (
                    <div
                      key={item.id}
                      className="grid grid-cols-2 gap-2 rounded-md border p-2 sm:grid-cols-[1fr_120px_64px_96px_32px] sm:items-center sm:border-none sm:p-0"
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
                        value={base}
                        onChange={(e) => {
                          const value = Number(e.target.value);
                          if (item.listRate == null) {
                            updateItem(item.id, { rate: value });
                          } else {
                            updateItem(item.id, { listRate: value });
                          }
                        }}
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
                          (Number(base) || 0) * (Number(item.qty) || 0),
                          symbol,
                        )}
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="size-8 justify-self-end text-muted-foreground hover:text-destructive"
                        onClick={() => removeItem(item.id)}
                        disabled={
                          !data.items.some((it) => it.externalCost) &&
                          data.items.filter((it) => !it.externalCost).length ===
                            1
                        }
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  );
                })}
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
              <p className="text-xs text-muted-foreground">
                Product discounts are always applied and combined with any
                manual discount above.
              </p>
              <div className="flex items-center gap-3">
                <Switch
                  id="creditsEnabled"
                  checked={data.creditsEnabled}
                  onCheckedChange={(checked) =>
                    update({ creditsEnabled: checked })
                  }
                />
                <Label htmlFor="creditsEnabled" className="font-normal">
                  Credit applied
                </Label>
                {data.creditsEnabled && (
                  <Input
                    type="number"
                    aria-label="Credit applied amount"
                    className="w-32"
                    value={data.creditsValue}
                    onChange={(e) =>
                      update({ creditsValue: Number(e.target.value) })
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
              <div className="flex flex-wrap items-center gap-3">
                <Label htmlFor="adjustmentValue" className="font-normal">
                  Adjustment
                </Label>
                <SignedNumberInput
                  id="adjustmentValue"
                  aria-label="Adjustment amount"
                  className="w-32"
                  value={data.adjustmentValue ?? 0}
                  onValueChange={(v) => update({ adjustmentValue: v })}
                />
                <p className="text-xs text-muted-foreground">
                  Enter a negative value to subtract, positive to add.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Installments</CardTitle>
            </CardHeader>
            <CardContent>
              <InstallmentsSection
                data={effectiveData}
                installmentsEnabled={data.installmentsEnabled}
                installments={data.installments}
                payments={data.payments}
                total={totals.total}
                dueDate={data.dueDate}
                currencySymbol={symbol}
                onEnabledChange={(enabled) =>
                  update({ installmentsEnabled: enabled })
                }
                onInstallmentsChange={(installments) =>
                  update({ installments })
                }
              />
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <PaymentsSection
                payments={data.payments}
                currencySymbol={symbol}
                installments={data.installments}
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
            <CardContent>
              <ReferencesSection
                items={data.items}
                currencySymbol={symbol}
                onChange={(items) => update({ items })}
              />
            </CardContent>
          </Card>

          <Card>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span>{formatMoney(totals.subtotal, symbol)}</span>
              </div>
              {totals.discount !== 0 && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Discount</span>
                  <span>-{formatMoney(totals.discount, symbol)}</span>
                </div>
              )}
              {totals.credits !== 0 && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Credit applied</span>
                  <span>-{formatMoney(totals.credits, symbol)}</span>
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
              {totals.adjustment !== 0 && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Adjustment</span>
                  <span>{formatMoney(totals.adjustment, symbol)}</span>
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

          <div className="flex flex-wrap items-center justify-end gap-2">
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
            <Popover>
              <PopoverTrigger
                render={
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    aria-label="Print settings"
                  />
                }
              >
                <Settings2 className="size-4" />
              </PopoverTrigger>
              <PopoverContent align="end">
                <PopoverHeader>
                  <PopoverTitle>Print settings</PopoverTitle>
                  <PopoverDescription>
                    Controls the preview and exported PDF when an invoice spans
                    multiple pages. Bill to always appears once, on the first
                    page.
                  </PopoverDescription>
                </PopoverHeader>
                <div className="flex items-center justify-between gap-3">
                  <Label htmlFor="headerMode" className="font-normal">
                    Repeat header on every page
                  </Label>
                  <Switch
                    id="headerMode"
                    checked={printSettings.headerMode === "every"}
                    onCheckedChange={(checked) =>
                      updatePrintSettings({
                        headerMode: checked ? "every" : "first",
                      })
                    }
                  />
                </div>
                <div className="flex items-center justify-between gap-3">
                  <Label htmlFor="footerMode" className="font-normal">
                    Repeat footer on every page
                  </Label>
                  <Switch
                    id="footerMode"
                    checked={printSettings.footerMode === "every"}
                    onCheckedChange={(checked) =>
                      updatePrintSettings({
                        footerMode: checked ? "every" : "last",
                      })
                    }
                  />
                </div>
              </PopoverContent>
            </Popover>
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

        <div className="h-150 w-full bg-muted p-4 lg:h-full lg:w-auto lg:flex-none">
          <div className="mx-auto h-full aspect-210/297 overflow-hidden shadow-2xl shadow-black/10 ring-1 ring-black/5">
            <PDFViewer data={deferredData ?? effectiveData} company={company} />
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
