"use client";

import { useMemo, useState } from "react";
import { MoreHorizontal, Package, Plus } from "lucide-react";
import { toast } from "sonner";
import {
  Button,
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
import { formatMoney } from "@/lib/totals";
import type { Product } from "@/lib/types";

export default function Page() {
  const { products, loaded, upsertProduct, removeProduct } = useProducts();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [deleting, setDeleting] = useState<Product | null>(null);

  const sorted = useMemo(
    () => [...products].sort((a, b) => a.name.localeCompare(b.name)),
    [products],
  );

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

      <Card className="mt-6 py-0">
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
              ) : sorted.length === 0 ? (
                <TableRow className="hover:bg-transparent">
                  <TableCell colSpan={5}>
                    <Empty>
                      <EmptyHeader>
                        <EmptyMedia variant="icon">
                          <Package />
                        </EmptyMedia>
                        <EmptyTitle>No products yet</EmptyTitle>
                        <EmptyDescription>
                          Add your first product to reuse it across invoices.
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
                sorted.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell className="truncate font-medium">
                      {product.name}
                    </TableCell>
                    <TableCell className="text-muted-foreground truncate">
                      {product.description || "—"}
                    </TableCell>
                    <TableCell className="text-right">
                      {product.basePriceUsd
                        ? formatMoney(product.basePriceUsd, "$")
                        : "—"}
                    </TableCell>
                    <TableCell className="text-right">
                      {product.basePriceBdt
                        ? formatMoney(product.basePriceBdt, "৳")
                        : "—"}
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
                          <span className="sr-only">Open menu</span>
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
              This removes the product. Existing invoices keep their saved line
              items, but will no longer link back to it.
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
