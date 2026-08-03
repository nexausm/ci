"use client";

import { useEffect, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { LineItem } from "@/lib/types";
import { newExternalCostItem } from "@/lib/defaults";
import { formatDateLong, formatMoney } from "@/lib/totals";

export function ReferencesSection({
  items,
  currencySymbol,
  onChange,
}: {
  items: LineItem[];
  currencySymbol: string;
  onChange: (items: LineItem[]) => void;
}) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<LineItem | null>(null);

  const externalItems = items.filter((item) => item.externalCost);

  function openAdd() {
    setEditing(newExternalCostItem());
    setDialogOpen(true);
  }

  function openEdit(item: LineItem) {
    setEditing(item);
    setDialogOpen(true);
  }

  function handleSave(item: LineItem) {
    const exists = items.some((i) => i.id === item.id);
    onChange(
      exists
        ? items.map((i) => (i.id === item.id ? item : i))
        : [...items, item],
    );
    setDialogOpen(false);
  }

  function handleRemove(id: string) {
    onChange(items.filter((i) => i.id !== id));
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold">External costs</h2>
          <p className="text-xs text-muted-foreground">
            Costs purchased for this client are added as line items, with the
            purchasing invoice referenced below.
          </p>
        </div>
        <Button type="button" variant="outline" size="sm" onClick={openAdd}>
          <Plus className="size-4" />
          Add external cost
        </Button>
      </div>

      {externalItems.length > 0 && (
        <div className="space-y-2">
          {externalItems.map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between gap-2 rounded-md border px-3 py-2 text-sm"
            >
              <button
                type="button"
                className="min-w-0 flex-1 text-left"
                onClick={() => openEdit(item)}
              >
                <div className="flex items-baseline justify-between gap-2">
                  <span className="truncate font-medium">
                    {item.description || "—"}
                  </span>
                  <span className="shrink-0">
                    {formatMoney(Number(item.rate) || 0, currencySymbol)}
                  </span>
                </div>
                <div className="mt-0.5 truncate text-xs text-muted-foreground">
                  {item.externalCost?.vendor}
                  {item.externalCost?.invoiceNumber
                    ? ` · ${item.externalCost.invoiceNumber}`
                    : ""}
                  {item.externalCost?.billedDate
                    ? ` · billed ${formatDateLong(item.externalCost.billedDate)}`
                    : ""}
                </div>
              </button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="size-8 shrink-0 text-muted-foreground hover:text-destructive"
                onClick={() => handleRemove(item.id)}
              >
                <Trash2 className="size-4" />
              </Button>
            </div>
          ))}
        </div>
      )}

      <ExternalCostDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        item={editing}
        onSave={handleSave}
      />
    </div>
  );
}

function ExternalCostDialog({
  open,
  onOpenChange,
  item,
  onSave,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: LineItem | null;
  onSave: (item: LineItem) => void;
}) {
  const [form, setForm] = useState<LineItem>(
    () => item ?? newExternalCostItem(),
  );

  useEffect(() => {
    if (open)
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setForm(
        item
          ? {
              ...item,
              externalCost: {
                ...(item.externalCost ?? {
                  vendor: "",
                  invoiceNumber: "",
                  billedDate: "",
                }),
              },
            }
          : newExternalCostItem(),
      );
  }, [open, item]);

  function update(patch: Partial<LineItem>) {
    setForm((f) => ({ ...f, ...patch }));
  }

  function updateExternalCost(patch: Partial<LineItem["externalCost"]>) {
    setForm((f) => ({
      ...f,
      externalCost: {
        ...(f.externalCost ?? {
          vendor: "",
          invoiceNumber: "",
          billedDate: "",
        }),
        ...patch,
      },
    }));
  }

  function updatePrice(value: number) {
    setForm((f) => ({ ...f, rate: value, listRate: value }));
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
            <DialogTitle>External cost</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-1.5">
              <Label htmlFor="external-description">Description</Label>
              <Input
                id="external-description"
                value={form.description}
                onChange={(e) => update({ description: e.target.value })}
                placeholder="Domain renewal, hosting, license…"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="external-price">Price</Label>
                <Input
                  id="external-price"
                  type="number"
                  step="0.01"
                  className="text-right"
                  value={form.rate}
                  onChange={(e) => updatePrice(Number(e.target.value))}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="external-date">Billed date</Label>
                <Input
                  id="external-date"
                  type="date"
                  value={form.externalCost?.billedDate ?? ""}
                  onChange={(e) =>
                    updateExternalCost({ billedDate: e.target.value })
                  }
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="external-vendor">Vendor</Label>
                <Input
                  id="external-vendor"
                  value={form.externalCost?.vendor ?? ""}
                  onChange={(e) =>
                    updateExternalCost({ vendor: e.target.value })
                  }
                  placeholder="Cloudflare"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="external-invoice">Invoice id</Label>
                <Input
                  id="external-invoice"
                  value={form.externalCost?.invoiceNumber ?? ""}
                  onChange={(e) =>
                    updateExternalCost({ invoiceNumber: e.target.value })
                  }
                  placeholder="INV-XXXXXXXXX"
                  required
                />
              </div>
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
            <Button type="submit">Save external cost</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
