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
import { createDefaultProduct } from "@/lib/defaults";
import type { Product } from "@/lib/types";

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
  const [form, setForm] = useState<Product>(
    () => product ?? createDefaultProduct(),
  );

  useEffect(() => {
    if (open) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setForm(product ?? createDefaultProduct());
    }
  }, [open, product]);

  function update(patch: Partial<Product>) {
    setForm((f) => ({ ...f, ...patch }));
  }

  const invalidDiscount =
    form.discountedPrice !== null && form.discountedPrice > form.basePrice;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) return;
    onSaved({ ...form, updatedAt: new Date().toISOString() });
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>
              {product ? "Edit product" : "New product"}
            </DialogTitle>
            <DialogDescription>
              Save a product once, then add it to any invoice.
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

            <div className="space-y-1.5">
              <Label htmlFor="product-base-price">Base price</Label>
              <Input
                id="product-base-price"
                type="number"
                step="0.01"
                min="0"
                value={form.basePrice}
                onChange={(e) => update({ basePrice: Number(e.target.value) })}
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="product-discounted-price">
                Discounted price (optional)
              </Label>
              <Input
                id="product-discounted-price"
                type="number"
                step="0.01"
                min="0"
                value={form.discountedPrice ?? ""}
                onChange={(e) =>
                  update({
                    discountedPrice:
                      e.target.value === "" ? null : Number(e.target.value),
                  })
                }
                placeholder="Lower price to charge"
              />
              <p className="text-xs text-muted-foreground">
                When this product is added to an invoice, the discounted price
                is used and the difference is shown as a discount on the
                invoice.
              </p>
              {invalidDiscount && (
                <p className="text-xs font-medium text-destructive">
                  Discounted price should not exceed the base price.
                </p>
              )}
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
            <Button type="submit">
              {product ? "Save changes" : "Add product"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
