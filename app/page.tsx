import Link from "next/link";
import { FileText, ShieldCheck, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function PublicHomePage() {
  return (
    <main className="flex min-h-svh items-center justify-center px-4">
      <div className="w-full max-w-xl space-y-8 text-center">
        <div className="space-y-3">
          <p className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">
            Nexaus
          </p>
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            Billing
          </h1>
          <p className="mx-auto max-w-md text-base text-muted-foreground">
            Create invoices, track payments, and get paid on time.
          </p>
        </div>

        <div className="flex items-center justify-center gap-3">
          <Button
            size="lg"
            nativeButton={false}
            render={<Link href="/dashboard" />}
          >
            Go to dashboard
          </Button>
          <Button
            size="lg"
            variant="outline"
            nativeButton={false}
            render={<Link href="/login" />}
          >
            Sign in
          </Button>
        </div>

        <div className="grid grid-cols-1 gap-3 pt-4 text-left sm:grid-cols-3">
          <div className="rounded-md border p-4">
            <FileText className="mb-2 size-5 text-muted-foreground" />
            <p className="text-sm font-medium">Invoicing</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Create and send professional invoices.
            </p>
          </div>
          <div className="rounded-md border p-4">
            <Wallet className="mb-2 size-5 text-muted-foreground" />
            <p className="text-sm font-medium">Payments</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Track installments and received payments.
            </p>
          </div>
          <div className="rounded-md border p-4">
            <ShieldCheck className="mb-2 size-5 text-muted-foreground" />
            <p className="text-sm font-medium">Secure</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Your billing data stays private.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
