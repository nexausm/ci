"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Download, Loader2, Plus, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { genId } from "@/lib/id";
import { createDefaultInstallment, defaultInstallments } from "@/lib/defaults";
import { withInstallmentAllocations } from "@/lib/totals";
import { formatDateLong, formatMoney } from "@/lib/totals";
import { downloadInstallmentPdf } from "@/lib/print-pdf";
import { getTemplate } from "@/lib/invoice-templates";
import { useCompany } from "@/app/providers/company-provider";
import { usePrintSettings } from "@/hooks/use-print-settings";
import { useTemplateId } from "@/hooks/use-template-id";
import type { Installment, InvoiceData, Payment } from "@/lib/types";

const round2 = (n: number) => Math.round(n * 100) / 100;

const INSTALLMENT_VARIANT: Record<
  "unpaid" | "partial" | "paid",
  "default" | "secondary" | "outline"
> = {
  unpaid: "secondary",
  partial: "default",
  paid: "default",
};

function InstallmentStatusBadge({ status }: { status: string }) {
  return (
    <Badge
      variant={INSTALLMENT_VARIANT[status as keyof typeof INSTALLMENT_VARIANT]}
    >
      {status === "paid" ? "Paid" : status === "partial" ? "Partial" : "Unpaid"}
    </Badge>
  );
}

export function InstallmentsSection({
  data,
  installmentsEnabled,
  installments,
  payments,
  total,
  dueDate,
  currencySymbol,
  onEnabledChange,
  onInstallmentsChange,
}: {
  data: InvoiceData;
  installmentsEnabled: boolean;
  installments: Installment[];
  payments: Payment[];
  total: number;
  dueDate: string;
  currencySymbol: string;
  onEnabledChange: (enabled: boolean) => void;
  onInstallmentsChange: (installments: Installment[]) => void;
}) {
  const [splitOpen, setSplitOpen] = useState(false);
  const [percentOpen, setPercentOpen] = useState(false);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const company = useCompany();
  const { settings: printSettings } = usePrintSettings();
  const { templateId } = useTemplateId();

  const scheduled = withInstallmentAllocations(installments, payments);
  const sumAmounts = installments.reduce(
    (s, i) => s + (Number(i.amount) || 0),
    0,
  );
  const mismatch = Math.abs(sumAmounts - total) > 0.005;

  function setEnabled(enabled: boolean) {
    onEnabledChange(enabled);
    if (enabled && installments.length === 0) {
      const first = createDefaultInstallment();
      onInstallmentsChange([
        { ...first, dueDate: dueDate || first.dueDate, amount: total },
      ]);
    }
  }

  function updateInstallment(id: string, patch: Partial<Installment>) {
    onInstallmentsChange(
      installments.map((i) => (i.id === id ? { ...i, ...patch } : i)),
    );
  }

  function addInstallment() {
    const seq = installments.length;
    const sumOthers = installments.reduce(
      (s, i) => s + (Number(i.amount) || 0),
      0,
    );
    const lastDue = installments[installments.length - 1]?.dueDate ?? dueDate;
    const row = createDefaultInstallment();
    onInstallmentsChange([
      ...installments,
      { ...row, seq, dueDate: lastDue, amount: Math.max(total - sumOthers, 0) },
    ]);
  }

  function removeInstallment(id: string) {
    const alloc = scheduled.find((a) => a.id === id);
    if (!alloc || (alloc.paidAmount ?? 0) > 0.005) return;
    onInstallmentsChange(installments.filter((i) => i.id !== id));
  }

  async function handleDownloadInstallment(inst: Installment) {
    setDownloadingId(inst.id);
    try {
      const template = getTemplate(templateId);
      await downloadInstallmentPdf(
        data,
        inst,
        company,
        printSettings,
        template,
      );
    } catch {
      toast.error("Failed to generate installment PDF");
    } finally {
      setDownloadingId(null);
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold">Installments</h2>
          <p className="text-xs text-muted-foreground">
            Split this invoice into a payment schedule. Payments are applied to
            the oldest unpaid installment first.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Label htmlFor="installmentsEnabled" className="font-normal">
            Enable
          </Label>
          <Switch
            id="installmentsEnabled"
            checked={installmentsEnabled}
            onCheckedChange={setEnabled}
          />
        </div>
      </div>

      {installmentsEnabled && (
        <>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addInstallment}
            >
              <Plus className="size-4" />
              Add installment
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setSplitOpen(true)}
            >
              Split evenly
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setPercentOpen(true)}
            >
              Set percentages
            </Button>
          </div>

          {scheduled.length > 0 && (
            <div className="overflow-hidden rounded-md border bg-card">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-8">#</TableHead>
                    <TableHead>Label</TableHead>
                    <TableHead className="w-32">Due date</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead className="text-right">Paid</TableHead>
                    <TableHead className="w-24">Status</TableHead>
                    <TableHead className="w-20" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {scheduled.map((inst) => {
                    const paidAmount = inst.paidAmount ?? 0;
                    return (
                      <TableRow key={inst.id}>
                        <TableCell className="text-muted-foreground">
                          {inst.seq + 1}
                        </TableCell>
                        <TableCell>
                          <Input
                            aria-label="Installment label"
                            className="h-8"
                            value={inst.label}
                            onChange={(e) =>
                              updateInstallment(inst.id, {
                                label: e.target.value,
                              })
                            }
                            placeholder="Deposit, balance…"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            aria-label="Installment due date"
                            type="date"
                            className="h-8"
                            value={inst.dueDate}
                            onChange={(e) =>
                              updateInstallment(inst.id, {
                                dueDate: e.target.value,
                              })
                            }
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            aria-label="Installment amount"
                            type="number"
                            step="0.01"
                            className="h-8 text-right"
                            value={inst.amount}
                            onChange={(e) =>
                              updateInstallment(inst.id, {
                                amount: Number(e.target.value),
                              })
                            }
                          />
                        </TableCell>
                        <TableCell className="text-right text-muted-foreground">
                          {paidAmount > 0
                            ? formatMoney(paidAmount, currencySymbol)
                            : "—"}
                        </TableCell>
                        <TableCell>
                          <InstallmentStatusBadge
                            status={inst.status ?? "unpaid"}
                          />
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="size-8 text-muted-foreground hover:text-foreground"
                              title="Download installment PDF"
                              disabled={downloadingId !== null}
                              onClick={() => handleDownloadInstallment(inst)}
                            >
                              {downloadingId === inst.id ? (
                                <Loader2 className="size-4 animate-spin" />
                              ) : (
                                <Download className="size-4" />
                              )}
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="size-8 text-muted-foreground hover:text-destructive"
                              title={
                                paidAmount > 0.005
                                  ? "Cannot delete an installment that has payments"
                                  : "Remove installment"
                              }
                              disabled={paidAmount > 0.005}
                              onClick={() => removeInstallment(inst.id)}
                            >
                              <Trash2 className="size-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
              <div className="flex items-center justify-between gap-2 border-t bg-muted/40 px-4 py-2 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <span>Scheduled:&nbsp;</span>
                  <span className="font-semibold text-foreground">
                    {formatMoney(sumAmounts, currencySymbol)}
                  </span>
                  {mismatch && (
                    <span className="text-destructive">
                      (invoice total is {formatMoney(total, currencySymbol)})
                    </span>
                  )}
                </div>
                <span className="hidden text-xs text-muted-foreground sm:inline">
                  {formatDateLong(
                    scheduled.find((s) => s.status !== "paid")?.dueDate ?? "",
                  )
                    ? `Next due ${formatDateLong(scheduled.find((s) => s.status !== "paid")?.dueDate ?? "")}`
                    : "All installments paid"}
                </span>
              </div>
            </div>
          )}
        </>
      )}

      <SplitEvenlyDialog
        open={splitOpen}
        onOpenChange={setSplitOpen}
        total={total}
        dueDate={dueDate}
        onApply={(count) => {
          onInstallmentsChange(defaultInstallments(total, dueDate, count));
        }}
      />
      <PercentDialog
        open={percentOpen}
        onOpenChange={setPercentOpen}
        installments={installments}
        total={total}
        currencySymbol={currencySymbol}
        onApply={onInstallmentsChange}
      />
    </div>
  );
}

function SplitEvenlyDialog({
  open,
  onOpenChange,
  total,
  dueDate,
  onApply,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  total: number;
  dueDate: string;
  onApply: (count: number) => void;
}) {
  const [count, setCount] = useState(3);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (open) setCount(3);
  }, [open]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onApply(Math.max(1, Math.floor(count) || 1));
    onOpenChange(false);
  }

  const each = count > 0 ? round2(total / Math.max(1, Math.floor(count))) : 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Split evenly</DialogTitle>
            <DialogDescription>
              Divides {formatMoney(total, "¤")} into equal installments. The
              last installment absorbs any rounding difference.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-1.5">
              <Label htmlFor="split-count">Number of installments</Label>
              <Input
                id="split-count"
                type="number"
                min={1}
                max={60}
                value={count}
                onChange={(e) => setCount(Number(e.target.value))}
                required
              />
            </div>
            <p className="text-xs text-muted-foreground">
              {count > 0
                ? `≈ ${formatMoney(each, "¤")} each, first due ${formatDateLong(dueDate) || "—"}.`
                : "Enter a number of installments."}
            </p>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit">Apply schedule</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

interface PercentRow {
  key: string;
  label: string;
  dueDate: string;
  pct: number;
}

function PercentDialog({
  open,
  onOpenChange,
  installments,
  total,
  currencySymbol,
  onApply,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  installments: Installment[];
  total: number;
  currencySymbol: string;
  onApply: (installments: Installment[]) => void;
}) {
  const [rows, setRows] = useState<PercentRow[]>([]);

  useEffect(() => {
    if (!open) return;
    const seed =
      installments.length > 0
        ? installments.map((i) => ({
            key: i.id,
            label: i.label,
            dueDate: i.dueDate,
            pct:
              total > 0 ? round2(((Number(i.amount) || 0) / total) * 100) : 0,
          }))
        : [
            { key: genId(), label: "", dueDate: "", pct: 50 },
            { key: genId(), label: "", dueDate: "", pct: 50 },
          ];
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setRows(seed);
  }, [open, installments, total]);

  const totalPct = rows.reduce((s, r) => s + (Number(r.pct) || 0), 0);
  const valid = Math.abs(totalPct - 100) <= 0.005 && rows.length > 0;

  function updateRow(key: string, patch: Partial<PercentRow>) {
    setRows((prev) =>
      prev.map((r) => (r.key === key ? { ...r, ...patch } : r)),
    );
  }

  function addRow() {
    setRows((prev) => [
      ...prev,
      { key: genId(), label: "", dueDate: "", pct: 0 },
    ]);
  }

  function removeRow(key: string) {
    setRows((prev) => prev.filter((r) => r.key !== key));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!valid) return;
    let sum = 0;
    const out = rows.map((r, i) => {
      const amount = round2((total * (Number(r.pct) || 0)) / 100);
      sum += amount;
      const final =
        i === rows.length - 1 ? round2(total - (sum - amount)) : amount;
      return {
        id: genId(),
        seq: i,
        label: r.label,
        dueDate: r.dueDate,
        amount: final,
      };
    });
    onApply(out);
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Set percentages</DialogTitle>
            <DialogDescription>
              Assign a percentage of the invoice total to each installment.
              Percentages must add up to 100%.
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-72 space-y-2 overflow-y-auto py-4">
            {rows.map((row, i) => (
              <div key={row.key} className="flex items-center gap-2">
                <span className="w-5 text-xs text-muted-foreground">
                  {i + 1}
                </span>
                <Input
                  aria-label="Installment label"
                  className="h-8 flex-1"
                  value={row.label}
                  onChange={(e) =>
                    updateRow(row.key, { label: e.target.value })
                  }
                  placeholder="Label (optional)"
                />
                <Input
                  aria-label="Due date"
                  type="date"
                  className="h-8 w-36"
                  value={row.dueDate}
                  onChange={(e) =>
                    updateRow(row.key, { dueDate: e.target.value })
                  }
                />
                <Input
                  aria-label="Percentage"
                  type="number"
                  step="0.01"
                  className="h-8 w-20 text-right"
                  value={row.pct}
                  onChange={(e) =>
                    updateRow(row.key, { pct: Number(e.target.value) })
                  }
                />
                <span className="w-6 text-xs text-muted-foreground">%</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="size-8 text-muted-foreground hover:text-destructive"
                  disabled={rows.length === 1}
                  onClick={() => removeRow(row.key)}
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="mt-1"
              onClick={addRow}
            >
              <Plus className="size-4" />
              Add row
            </Button>
          </div>
          <DialogFooter className="items-center">
            <p
              className={`mr-auto text-sm font-medium ${valid ? "text-muted-foreground" : "text-destructive"}`}
            >
              Total: {round2(totalPct)}% · {formatMoney(total, currencySymbol)}
            </p>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={!valid}>
              Apply schedule
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
