"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import type { Product } from "@/lib/types";

export function ProductPicker({
  products,
  currency,
  onSelect,
}: {
  products: Product[];
  currency: "USD" | "BDT";
  onSelect: (product: Product) => void;
}) {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  function priceFor(product: Product) {
    const base =
      currency === "USD"
        ? Number(product.basePriceUsd) || 0
        : Number(product.basePriceBdt) || 0;
    const discounted =
      currency === "USD"
        ? product.discountedPriceUsd
        : product.discountedPriceBdt;
    if (discounted !== null && discounted !== undefined) {
      return `${discounted} (was ${base})`;
    }
    return String(base);
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="justify-between font-normal"
          />
        }
      >
        <Package className="size-4" />
        <span>Add product</span>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="start">
        <Command>
          <CommandInput placeholder="Search products…" />
          <CommandList>
            <CommandEmpty>
              {products.length === 0 ? "No products yet." : "No product found."}
            </CommandEmpty>
            <CommandGroup>
              {products.map((product) => (
                <CommandItem
                  key={product.id}
                  value={product.name}
                  onSelect={() => {
                    onSelect(product);
                    setOpen(false);
                  }}
                >
                  <div className="flex flex-col overflow-hidden">
                    <span className="truncate">{product.name}</span>
                    {product.description && (
                      <span className="truncate text-xs text-muted-foreground">
                        {product.description}
                      </span>
                    )}
                  </div>
                  <span className="ml-auto shrink-0 text-xs tabular-nums text-muted-foreground">
                    {priceFor(product)}
                  </span>
                </CommandItem>
              ))}
            </CommandGroup>
            <CommandSeparator />
            <CommandGroup>
              <CommandItem
                value="manage-products"
                onSelect={() => {
                  setOpen(false);
                  router.push("/products");
                }}
              >
                Manage products…
              </CommandItem>
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
