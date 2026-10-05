"use client";

import { useMemo, useState } from "react";
import { MoreHorizontal, Package, Plus, Search } from "lucide-react";
import { toast } from "sonner";
import {
  Button,
  Input,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  Card,
  CardContent,
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  Skeleton,
} from "@/components/ui";

import { useProducts } from "@/lib/storage";
import { ProductFormDialog } from "@/components/custom/product/form-dialog";
import type { Product } from "@/lib/types";

function formatPrice(value: number): string {
  return (Number(value) || 0).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function PriceCell({
  base,
  discounted,
}: {
  base: number;
  discounted: number | null | undefined;
}) {
  return (
    <div className="flex flex-col items-end">
      <span className="tabular-nums">{formatPrice(base)}</span>
      {discounted != null && (
        <span className="text-muted-foreground text-xs tabular-nums">
          disc. {formatPrice(discounted)}
        </span>
      )}
    </div>
  );
}

export default function Page() {
  const { products, loaded, upsertProduct, removeProduct } = useProducts();
  const [query, setQuery] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [deleting, setDeleting] = useState<Product | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const sorted = [...products].sort((a, b) => a.name.localeCompare(b.name));
    if (!q) return sorted;
    return sorted.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q),
    );
  }, [products, query]);

  async function handleSaved(product: Product) {
    const isNew = !products.some((p) => p.id === product.id);
    try {
      await upsertProduct(product);
      toast.success(isNew ? "Product added" : "Product updated");
    } catch {
      toast.error("Failed to save product");
    }
  }

  async function confirmDelete() {
    if (!deleting) return;
    try {
      await removeProduct(deleting.id);
      toast.success("Product deleted");
    } catch {
      toast.error("Failed to delete product");
    }
    setDeleting(null);
  }

  return (
    <div className="w-full px-4 py-8 sm:px-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Products</h1>
          <p className="text-muted-foreground text-sm">
            Reusable goods and services you bill for.
          </p>
        </div>
        <Button
          onClick={() => {
            setEditing(null);
            setDialogOpen(true);
          }}
        >
          <Plus className="size-4" />
          New product
        </Button>
      </div>

      <div className="mt-6 max-w-sm">
        <div className="relative">
          <Search className="text-muted-foreground absolute top-1/2 left-2.5 size-4 -translate-y-1/2" />
          <Input
            placeholder="Search products…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-8"
          />
        </div>
      </div>

      <Card className="mt-4 py-0">
        <CardContent className="p-0">
          <Table className="table-fixed">
            <TableHeader>
              <TableRow>
                <TableHead className="w-[30%]">Name</TableHead>
                <TableHead>Description</TableHead>
                <TableHead className="w-25 text-right">USD price</TableHead>
                <TableHead className="w-25 text-right">BDT price</TableHead>
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {!loaded ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-24">
                    <Skeleton className="h-6 w-full" />
                  </TableCell>
                </TableRow>
              ) : filtered.length === 0 ? (
                <TableRow className="hover:bg-transparent">
                  <TableCell colSpan={5}>
                    <Empty>
                      <EmptyHeader>
                        <EmptyMedia variant="icon">
                          <Package />
                        </EmptyMedia>
                        <EmptyTitle>
                          {products.length === 0
                            ? "No products yet"
                            : "No matches"}
                        </EmptyTitle>
                        <EmptyDescription>
                          {products.length === 0
                            ? "Add your first product to reuse it across invoices."
                            : "No products match your search."}
                        </EmptyDescription>
                      </EmptyHeader>
                      {products.length === 0 && (
                        <EmptyContent>
                          <Button
                            variant="outline"
                            onClick={() => setDialogOpen(true)}
                          >
                            <Plus data-icon="inline-start" />
                            Add your first product
                          </Button>
                        </EmptyContent>
                      )}
                    </Empty>
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell className="truncate font-medium">
                      {product.name}
                    </TableCell>
                    <TableCell className="text-muted-foreground truncate">
                      {product.description || "—"}
                    </TableCell>
                    <TableCell className="text-right">
                      <PriceCell
                        base={Number(product.basePriceUsd) || 0}
                        discounted={product.discountedPriceUsd}
                      />
                    </TableCell>
                    <TableCell className="text-right">
                      <PriceCell
                        base={Number(product.basePriceBdt) || 0}
                        discounted={product.discountedPriceBdt}
                      />
                    </TableCell>
                    <TableCell>
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
                            onClick={() => {
                              setEditing(product);
                              setDialogOpen(true);
                            }}
                          >
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            variant="destructive"
                            onClick={() => setDeleting(product)}
                          >
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

      <ProductFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        product={editing}
        onSaved={handleSaved}
      />

      <AlertDialog
        open={!!deleting}
        onOpenChange={(o) => !o && setDeleting(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {deleting?.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              This removes the product from your catalog. Invoices that already
              use it are not changed.
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
