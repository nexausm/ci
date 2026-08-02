"use client";

import { useState } from "react";
import { Check, ChevronsUpDown, UserPlus } from "lucide-react";
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
import { cn } from "@/lib/utils";
import type { Client } from "@/lib/types";
import { ClientFormDialog } from "./client-form-dialog";

export function ClientPicker({
  clients,
  value,
  onSelect,
  onCreateClient,
}: {
  clients: Client[];
  value: string | null;
  onSelect: (client: Client) => void;
  onCreateClient: (client: Client) => void;
}) {
  const [open, setOpen] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const selected = clients.find((c) => c.id === value) ?? null;

  return (
    <>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger
          render={
            <Button
              type="button"
              variant="outline"
              className="w-full justify-between font-normal"
            />
          }
        >
          <span className="truncate">
            {selected ? selected.name : "Select a client…"}
          </span>
          <ChevronsUpDown className="ml-2 size-4 shrink-0 opacity-50" />
        </PopoverTrigger>
        <PopoverContent className="w-80 p-0" align="start">
          <Command>
            <CommandInput placeholder="Search clients…" />
            <CommandList>
              <CommandEmpty>No client found.</CommandEmpty>
              <CommandGroup>
                {clients.map((client) => (
                  <CommandItem
                    key={client.id}
                    value={client.name}
                    onSelect={() => {
                      onSelect(client);
                      setOpen(false);
                    }}
                  >
                    <Check
                      className={cn(
                        "size-4",
                        client.id === value ? "opacity-100" : "opacity-0",
                      )}
                    />
                    <div className="flex flex-col overflow-hidden">
                      <span className="truncate">{client.name}</span>
                      {client.email && (
                        <span className="truncate text-xs text-muted-foreground">
                          {client.email}
                        </span>
                      )}
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
              <CommandSeparator />
              <CommandGroup>
                <CommandItem
                  onSelect={() => {
                    setOpen(false);
                    setDialogOpen(true);
                  }}
                >
                  <UserPlus className="size-4" />
                  Add new client
                </CommandItem>
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      <ClientFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        client={null}
        onSaved={(client) => {
          onCreateClient(client);
          onSelect(client);
        }}
      />
    </>
  );
}
