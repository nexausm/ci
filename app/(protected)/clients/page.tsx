"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Building2, MoreHorizontal, Plus, User, Users } from "lucide-react";
import { toast } from "sonner";
import {
  Button,
  Badge,
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
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  Skeleton,
} from "@/components/ui";

import { useClients, useInvoices } from "@/lib/storage";
import { ClientFormDialog } from "@/components/custom/client/form-dialog";
import type { Client } from "@/lib/types";

export default function Page() {
  const { clients, loaded, upsertClient, removeClient } = useClients();
  const { invoices } = useInvoices();
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

  const sorted = useMemo(
    () => [...clients].sort((a, b) => a.name.localeCompare(b.name)),
    [clients],
  );

  async function handleSaved(client: Client) {
    const isNew = !clients.some((c) => c.id === client.id);
    try {
      await upsertClient(client);
      toast.success(isNew ? "Client added" : "Client updated");
    } catch {
      toast.error("Failed to save client");
    }
  }

  async function confirmDelete() {
    if (!deleting) return;
    try {
      await removeClient(deleting.id);
      toast.success("Client deleted");
    } catch {
      toast.error("Failed to delete client");
    }
    setDeleting(null);
  }

  return (
    <div className="w-full px-4 py-8 sm:px-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Clients</h1>
          <p className="text-muted-foreground text-sm">
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

      <Card className="mt-6 py-0">
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
                  <TableCell colSpan={6} className="h-24">
                    <Skeleton className="h-6 w-full" />
                  </TableCell>
                </TableRow>
              ) : sorted.length === 0 ? (
                <TableRow className="hover:bg-transparent">
                  <TableCell colSpan={6}>
                    <Empty>
                      <EmptyHeader>
                        <EmptyMedia variant="icon">
                          <Users />
                        </EmptyMedia>
                        <EmptyTitle>No clients yet</EmptyTitle>
                        <EmptyDescription>
                          Add your first client to start billing them.
                        </EmptyDescription>
                      </EmptyHeader>
                    </Empty>
                  </TableCell>
                </TableRow>
              ) : (
                sorted.map((client) => (
                  <TableRow key={client.id}>
                    <TableCell className="truncate font-medium">
                      <Link
                        href={`/?clientId=${client.id}`}
                        className="hover:underline"
                      >
                        {client.name}
                      </Link>
                      {client.type === "organization" && client.contactName && (
                        <div className="text-muted-foreground text-xs font-normal">
                          {client.contactName}
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
                    <TableCell className="text-muted-foreground truncate">
                      {client.email || "—"}
                    </TableCell>
                    <TableCell className="text-muted-foreground truncate">
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
