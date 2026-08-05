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
import { Building2, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { createDefaultClient } from "@/lib/defaults";
import type { Client, ClientType } from "@/lib/types";

export function ClientFormDialog({
  open,
  onOpenChange,
  client,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  client: Client | null;
  onSaved: (client: Client) => void;
}) {
  const [form, setForm] = useState<Client>(
    () => client ?? createDefaultClient(),
  );

  useEffect(() => {
    if (open) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setForm(client ?? createDefaultClient());
    }
  }, [open, client]);

  function update(patch: Partial<Client>) {
    setForm((f) => ({ ...f, ...patch }));
  }

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
            <DialogTitle>{client ? "Edit client" : "New client"}</DialogTitle>
            <DialogDescription>
              Save client details once, reuse them across invoices.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-1.5">
              <Label>Client type</Label>
              <div className="grid grid-cols-2 gap-2">
                {(
                  [
                    { value: "individual", label: "Individual", icon: User },
                    {
                      value: "organization",
                      label: "Organization",
                      icon: Building2,
                    },
                  ] as { value: ClientType; label: string; icon: typeof User }[]
                ).map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => update({ type: opt.value })}
                    className={cn(
                      "flex items-center justify-center gap-2 rounded-md border px-3 py-2 text-sm font-medium transition-colors",
                      form.type === opt.value
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-input hover:bg-accent",
                    )}
                  >
                    <opt.icon className="size-4" />
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="client-name">
                {form.type === "organization"
                  ? "Organization name"
                  : "Full name"}
              </Label>
              <Input
                id="client-name"
                value={form.name}
                onChange={(e) => update({ name: e.target.value })}
                placeholder={
                  form.type === "organization" ? "Acme Inc." : "Jane Doe"
                }
                required
              />
            </div>

            {form.type === "organization" && (
              <div className="space-y-1.5">
                <Label htmlFor="client-contact">
                  Contact person (optional)
                </Label>
                <Input
                  id="client-contact"
                  value={form.contactName}
                  onChange={(e) => update({ contactName: e.target.value })}
                  placeholder="John Smith"
                />
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="client-email">Email</Label>
                <Input
                  id="client-email"
                  type="email"
                  value={form.email}
                  onChange={(e) => update({ email: e.target.value })}
                  placeholder="client@example.com"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="client-phone">Phone</Label>
                <Input
                  id="client-phone"
                  value={form.phone}
                  onChange={(e) => update({ phone: e.target.value })}
                  placeholder="+1 555 000 0000"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="client-address">Address (one line per row)</Label>
              <Textarea
                id="client-address"
                rows={2}
                value={form.addressLines.join("\n")}
                onChange={(e) =>
                  update({ addressLines: e.target.value.split("\n") })
                }
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="client-notes">Notes (optional)</Label>
              <Textarea
                id="client-notes"
                rows={2}
                value={form.notes}
                onChange={(e) => update({ notes: e.target.value })}
                placeholder="Internal notes about this client…"
              />
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
              {client ? "Save changes" : "Add client"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
