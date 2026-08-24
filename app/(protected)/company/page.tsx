"use client";

import { useEffect, useState } from "react";
import { Building2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { fetchCompanyProfile, updateCompanyProfile } from "@/lib/storage";
import type { CompanyInfo } from "@/lib/types";

const EMPTY: CompanyInfo = {
  companyName: "",
  numberLabel: "",
  numberValue: "",
  addressLines: [],
  phone: "",
  email: "",
  logoUrl: null,
};

export default function Page() {
  const [form, setForm] = useState<CompanyInfo>(EMPTY);
  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetchCompanyProfile().then((info) => {
      if (cancelled) return;
      setForm(info);
      setLoaded(true);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  function update(patch: Partial<CompanyInfo>) {
    setForm((f) => ({ ...f, ...patch }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const saved = await updateCompanyProfile(form);
      setForm(saved);
      toast.success("Company profile saved");
    } catch {
      toast.error("Failed to save company profile");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="w-full px-4 py-8 sm:px-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Company</h1>
        <p className="text-sm text-muted-foreground">
          Your billing identity — appears on invoices, quotes and printouts.
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        <Card className="mt-6 max-w-2xl">
          <CardHeader>
            <CardTitle className="text-base">Company profile</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="flex items-end gap-4">
              <div className="flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-lg border bg-accent">
                {form.logoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={form.logoUrl}
                    alt="Company logo"
                    className="size-full object-contain"
                  />
                ) : (
                  <Building2 className="size-6 text-muted-foreground" />
                )}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="company-logo-url">Logo URL</Label>
              <Input
                id="company-logo-url"
                type="url"
                inputMode="url"
                value={form.logoUrl ?? ""}
                onChange={(e) =>
                  update({
                    logoUrl: e.target.value.trim() ? e.target.value : null,
                  })
                }
                placeholder="https://cdn.example.com/logo.png"
              />
              <p className="text-xs text-muted-foreground">
                Direct link to a hosted image (PNG, JPG, SVG, WebP, GIF).
              </p>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="company-name">Company name</Label>
              <Input
                id="company-name"
                value={form.companyName}
                onChange={(e) => update({ companyName: e.target.value })}
                placeholder="Nexaus Cloud"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="company-number-label">
                  Invoice number label
                </Label>
                <Input
                  id="company-number-label"
                  value={form.numberLabel}
                  onChange={(e) => update({ numberLabel: e.target.value })}
                  placeholder="Invoice #"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="company-number-value">
                  Invoice number value
                </Label>
                <Input
                  id="company-number-value"
                  value={form.numberValue}
                  onChange={(e) => update({ numberValue: e.target.value })}
                  placeholder="NEXA-2026-"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="company-phone">Phone</Label>
                <Input
                  id="company-phone"
                  value={form.phone}
                  onChange={(e) => update({ phone: e.target.value })}
                  placeholder="+880 96 96 1212 70"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="company-email">Email</Label>
                <Input
                  id="company-email"
                  type="email"
                  value={form.email}
                  onChange={(e) => update({ email: e.target.value })}
                  placeholder="contact@example.com"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="company-address">
                Address (one line per row)
              </Label>
              <Textarea
                id="company-address"
                rows={3}
                value={form.addressLines.join("\n")}
                onChange={(e) =>
                  update({ addressLines: e.target.value.split("\n") })
                }
                placeholder={
                  "5123-5124, 4th Floor (Comilla IT Park)\nBangladesh, 3500"
                }
              />
            </div>

            <div className="flex justify-end pt-2">
              <Button type="submit" disabled={saving || !loaded}>
                {saving && <Loader2 className="size-4 animate-spin" />}
                {saving ? "Saving…" : "Save profile"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}
