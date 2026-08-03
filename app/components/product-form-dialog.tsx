"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createDefaultProduct, sanitizeProduct } from "@/lib/defaults";
import type { Product } from "@/lib/types";

function PriceFields({
  currency,
  base,
  discounted,
  invalid,
  onBaseChange,
  onDiscountedChange,
}: {
  currency: "USD" | "BDT";
  base: number;
  discounted: number | null;
  invalid: boolean;
  onBaseChange: (value: number) => void;
  onDiscountedChange: (value: number | null) => void;
}) {
  const symbol = currency === "USD" ? "$" : "৳";
  return (
    <div className="rounded-lg border p-3">
      <Label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        Price · {currency}
      </Label>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor={`product-base-${currency}`}>Base price</Label>
          <Input
            id={`product-base-${currency}`}
            type="number"
            step="0.01"
            min="0"
            placeholder={symbol}
            value={base ?? 0}
            onChange={(e) => onBaseChange(Number(e.target.value))}
            required
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor={`product-discounted-${currency}`}>
            Discounted (optional)
          </Label>
          <Input
            id={`product-discounted-${currency}`}
            type="number"
            step="0.01"
            min="0"
            placeholder="Lower price"
            value={discounted ?? ""}
            onChange={(e) =>
              onDiscountedChange(
                e.target.value === "" ? null : Number(e.target.value),
              )
            }
          />
        </div>
      </div>
      {invalid && (
        <p className="mt-2 text-xs font-medium text-destructive">
          Discounted price should not exceed the {currency} base price.
        </p>
      )}
    </div>
  );
}

export function ProductFormDialog({
  open,
  onOpenChange,
  product,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: Product | null;
  onSaved: (product: Product) => void;
}) {
  const [form, setForm] = useState<Product>(() =>
    sanitizeProduct(product ?? createDefaultProduct()),
  );

  useEffect(() => {
    if (open) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setForm(sanitizeProduct(product ?? createDefaultProduct()));
    }
  }, [open, product]);

  function update(patch: Partial<Product>) {
    setForm((f) => ({ ...f, ...patch }));
  }

  const invalidUsd =
    form.discountedPriceUsd !== null && form.discountedPriceUsd > form.basePriceUsd;
  const invalidBdt =
    form.discountedPriceBdt !== null &&
    form.discountedPriceBdt > form.basePriceBdt;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) return;
    onSaved({ ...form, updatedAt: new Date().toISOString() });
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>
              {product ? "Edit product" : "New product"}
            </DialogTitle>
            <DialogDescription>
              Save a product once, then add it to any invoice. Provide prices for
              both USD and BDT — the invoice&apos;s currency picks the matching
              price.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-1.5">
              <Label htmlFor="product-name">Name</Label>
              <Input
                id="product-name"
                value={form.name}
                onChange={(e) => update({ name: e.target.value })}
                placeholder="Web design retainer"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="product-description">
                Description (optional)
              </Label>
              <Textarea
                id="product-description"
                rows={2}
                value={form.description}
                onChange={(e) => update({ description: e.target.value })}
                placeholder="Brief detail shown on invoices…"
              />
            </div>

            <PriceFields
              currency="USD"
              base={form.basePriceUsd}
              discounted={form.discountedPriceUsd}
              invalid={invalidUsd}
              onBaseChange={(v) => update({ basePriceUsd: v })}
              onDiscountedChange={(v) => update({ discountedPriceUsd: v })}
            />

            <PriceFields
              currency="BDT"
              base={form.basePriceBdt}
              discounted={form.discountedPriceBdt}
              invalid={invalidBdt}
              onBaseChange={(v) => update({ basePriceBdt: v })}
              onDiscountedChange={(v) => update({ discountedPriceBdt: v })}
            />

            <p className="text-xs text-muted-foreground">
              When this product is added to an invoice, the discounted price for
              the invoice&apos;s currency is used and the difference from the
              base price is shown as a discount on the invoice.
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
            <Button type="submit">
              {product ? "Save changes" : "Add product"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
