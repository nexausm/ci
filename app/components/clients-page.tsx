"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Building2, MoreHorizontal, Plus, Search, User } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
import { useClients, useInvoices } from "@/lib/storage";
import { ClientFormDialog } from "@/app/components/client-form-dialog";
import type { Client } from "@/lib/types";

export function ClientsPage() {
  const { clients, loaded, upsertClient, removeClient } = useClients();
  const { invoices } = useInvoices();
  const [query, setQuery] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Client | null>(null);
  const [deleting, setDeleting] = useState<Client | null>(null);

  const invoiceCountByClient = useMemo(() => {
    const map = new Map<string, number>();
    for (const inv of invoices) {
      if (!inv.clientId) continue;
      map.set(inv.clientId, (map.get(inv.clientId) ?? 0) + 1);
    }
    return map;
  }, [invoices]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const sorted = [...clients].sort((a, b) => a.name.localeCompare(b.name));
    if (!q) return sorted;
    return sorted.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q) ||
        c.phone.toLowerCase().includes(q),
    );
  }, [clients, query]);

  function handleSaved(client: Client) {
    const isNew = !clients.some((c) => c.id === client.id);
    upsertClient(client);
    toast.success(isNew ? "Client added" : "Client updated");
  }

  function confirmDelete() {
    if (!deleting) return;
    removeClient(deleting.id);
    toast.success("Client deleted");
    setDeleting(null);
  }

  return (
    <div className="w-full px-4 py-8 sm:px-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Clients</h1>
          <p className="text-sm text-muted-foreground">
            Individuals and organizations you bill.
          </p>
        </div>
        <Button
          onClick={() => {
            setEditing(null);
            setDialogOpen(true);
          }}
        >
          <Plus className="size-4" />
          New client
        </Button>
      </div>

      <div className="mt-6 max-w-sm">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search clients…"
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
                <TableHead className="w-[26%]">Name</TableHead>
                <TableHead className="w-35">Type</TableHead>
                <TableHead>Email</TableHead>
                <TableHead className="w-37.5">Phone</TableHead>
                <TableHead className="w-22.5 text-right">Invoices</TableHead>
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {!loaded ? (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="h-24 text-center text-muted-foreground"
                  >
                    Loading…
                  </TableCell>
                </TableRow>
              ) : filtered.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="h-24 text-center text-muted-foreground"
                  >
                    {clients.length === 0
                      ? "No clients yet. Add your first client to get started."
                      : "No clients match your search."}
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((client) => (
                  <TableRow key={client.id}>
                    <TableCell className="truncate font-medium">
                      <Link
                        href={`/?clientId=${client.id}`}
                        className="hover:underline"
                      >
                        {client.name}
                      </Link>
                      {client.type === "organization" && client.contactName && (
                        <div className="text-xs font-normal text-muted-foreground">
                          Attn: {client.contactName}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="gap-1 font-normal">
                        {client.type === "organization" ? (
                          <Building2 className="size-3" />
                        ) : (
                          <User className="size-3" />
                        )}
                        {client.type === "organization"
                          ? "Organization"
                          : "Individual"}
                      </Badge>
                    </TableCell>
                    <TableCell className="truncate text-muted-foreground">
                      {client.email || "—"}
                    </TableCell>
                    <TableCell className="truncate text-muted-foreground">
                      {client.phone || "—"}
                    </TableCell>
                    <TableCell className="text-right">
                      {invoiceCountByClient.get(client.id) ?? 0}
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
                              setEditing(client);
                              setDialogOpen(true);
                            }}
                          >
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            render={<Link href={`/?clientId=${client.id}`} />}
                          >
                            View invoices
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            variant="destructive"
                            onClick={() => setDeleting(client)}
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

      <ClientFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        client={editing}
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
              This removes the client record. Invoices already billed to them
              are not deleted, but will no longer link to a saved client.
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
