"use client";

import { useMemo, useState } from "react";
import { MoreHorizontal, Package, Plus, Search } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { Card, CardContent } from "@/components/ui/card";
import { useProducts } from "@/lib/storage";
import { ProductFormDialog } from "@/app/components/product-form-dialog";
import type { Product } from "@/lib/types";

function formatPrice(value: number): string {
  return value.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function ProductsPage() {
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
          <p className="text-sm text-muted-foreground">
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
          <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
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
                <TableHead className="w-[34%]">Name</TableHead>
                <TableHead>Description</TableHead>
                <TableHead className="w-27.5 text-right">Base price</TableHead>
                <TableHead className="w-27.5 text-right">
                  Discounted price
                </TableHead>
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {!loaded ? (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="h-24 text-center text-muted-foreground"
                  >
                    Loading…
                  </TableCell>
                </TableRow>
              ) : filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-32 text-center">
                    <div className="flex flex-col items-center gap-2 text-muted-foreground">
                      <Package className="size-8" />
                      <p>
                        {products.length === 0
                          ? "No products yet. Add your first product to get started."
                          : "No products match your search."}
                      </p>
                      {products.length === 0 && (
                        <Button
                          size="sm"
                          className="mt-1"
                          onClick={() => setDialogOpen(true)}
                        >
                          <Plus className="size-4" />
                          Add your first product
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell className="truncate font-medium">
                      {product.name}
                    </TableCell>
                    <TableCell className="truncate text-muted-foreground">
                      {product.description || "—"}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatPrice(Number(product.basePrice) || 0)}
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground">
                      {product.discountedPrice === null ? (
                        "—"
                      ) : (
                        <span className="font-medium text-foreground">
                          {formatPrice(Number(product.discountedPrice) || 0)}
                        </span>
                      )}
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
