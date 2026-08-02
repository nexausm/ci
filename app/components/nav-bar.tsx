"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { FileText, LayoutDashboard, Plus, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useCompany } from "@/app/providers/company-provider";

const links = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/clients", label: "Clients", icon: Users, exact: false },
];

export function NavBar() {
  const pathname = usePathname();
  const company = useCompany();

  return (
    <header className="sticky top-0 z-20 border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/80">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2 font-semibold">
            <FileText className="size-5" />
            <span className="hidden sm:inline">{company.companyName}</span>
          </Link>
          <nav className="flex items-center gap-1">
            {links.map((link) => {
              const active = link.exact
                ? pathname === link.href
                : pathname.startsWith(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                    active
                      ? "bg-secondary text-secondary-foreground"
                      : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground",
                  )}
                >
                  <link.icon className="size-4" />
                  {link.label}
                </Link>
              );
            })}
          </nav>
        </div>
        <Button
          size="sm"
          nativeButton={false}
          render={<Link href="/invoices/new" />}
        >
          <Plus className="size-4" />
          New invoice
        </Button>
      </div>
    </header>
  );
}
