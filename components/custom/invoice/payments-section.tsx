"use client";

import { useEffect, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { PAYMENT_METHODS, type Payment } from "@/lib/types";
import { newPayment } from "@/lib/defaults";
import { formatDateLong, formatMoney } from "@/lib/totals";
import { genId } from "@/lib/id";

export function PaymentsSection({
  payments,
  currencySymbol,
  onChange,
}: {
  payments: Payment[];
  currencySymbol: string;
  onChange: (payments: Payment[]) => void;
}) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Payment | null>(null);

  const total = payments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);

  function openAdd() {
    setEditing(newPayment());
    setDialogOpen(true);
  }

  function openEdit(payment: Payment) {
    setEditing(payment);
    setDialogOpen(true);
  }

  function handleSave(payment: Payment) {
    const exists = payments.some((p) => p.id === payment.id);
    onChange(
      exists
        ? payments.map((p) => (p.id === payment.id ? payment : p))
        : [...payments, payment],
    );
    setDialogOpen(false);
  }

  function handleRemove(id: string) {
    onChange(payments.filter((p) => p.id !== id));
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold">Payments received</h2>
          <p className="text-xs text-muted-foreground">
            Record every deposit or partial payment for this invoice.
          </p>
        </div>
        <Button type="button" variant="outline" size="sm" onClick={openAdd}>
          <Plus className="size-4" />
          Add payment
        </Button>
      </div>

      {payments.length > 0 && (
        <div className="overflow-hidden rounded-md border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Method</TableHead>
                <TableHead>Note</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {[...payments]
                .sort((a, b) => a.date.localeCompare(b.date))
                .map((payment) => (
                  <TableRow
                    key={payment.id}
                    className="cursor-pointer"
                    onClick={() => openEdit(payment)}
                  >
                    <TableCell>{formatDateLong(payment.date)}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {payment.method}
                    </TableCell>
                    <TableCell className="max-w-48 truncate text-muted-foreground">
                      {payment.note || "—"}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatMoney(Number(payment.amount) || 0, currencySymbol)}
                    </TableCell>
                    <TableCell>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="size-8 text-muted-foreground hover:text-destructive"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemove(payment.id);
                        }}
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
          <div className="flex justify-end border-t bg-muted/40 px-4 py-2 text-sm">
            <span className="text-muted-foreground">Total received:&nbsp;</span>
            <span className="font-semibold">
              {formatMoney(total, currencySymbol)}
            </span>
          </div>
        </div>
      )}

      <PaymentDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        payment={editing}
        onSave={handleSave}
      />
    </div>
  );
}

function PaymentDialog({
  open,
  onOpenChange,
  payment,
  onSave,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  payment: Payment | null;
  onSave: (payment: Payment) => void;
}) {
  const [form, setForm] = useState<Payment>(() => payment ?? newPayment());

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (open) setForm(payment ?? { ...newPayment(), id: genId() });
  }, [open, payment]);

  function update(patch: Partial<Payment>) {
    setForm((f) => ({ ...f, ...patch }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onSave(form);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Record payment</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="payment-date">Date</Label>
                <Input
                  id="payment-date"
                  type="date"
                  value={form.date}
                  onChange={(e) => update({ date: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="payment-amount">Amount</Label>
                <Input
                  id="payment-amount"
                  type="number"
                  step="0.01"
                  value={form.amount}
                  onChange={(e) => update({ amount: Number(e.target.value) })}
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="payment-method">Method</Label>
              <Select
                value={form.method}
                onValueChange={(v) =>
                  update({ method: v as Payment["method"] })
                }
              >
                <SelectTrigger id="payment-method" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PAYMENT_METHODS.map((method) => (
                    <SelectItem key={method} value={method}>
                      {method}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="payment-note">Note (optional)</Label>
              <Input
                id="payment-note"
                value={form.note}
                onChange={(e) => update({ note: e.target.value })}
                placeholder="Reference, cheque no…"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit">Save payment</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
