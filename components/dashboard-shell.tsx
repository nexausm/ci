"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  Building2,
  FilePlus2,
  LayoutDashboard,
  LogOut,
  Package,
  Settings,
  Users,
} from "lucide-react";

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { useCompany } from "@/app/providers/company-provider";

const NAV_MAIN = [
  {
    href: "/dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
    exact: true,
  },
  { href: "/clients", label: "Clients", icon: Users, exact: false },
  { href: "/products", label: "Products", icon: Package, exact: false },
  {
    href: "/invoices/new",
    label: "New Invoice",
    icon: FilePlus2,
    exact: false,
  },
];

const NAV_SECONDARY = [
  { href: "/company", label: "Company", icon: Building2, exact: false },
];

const pageNames: { prefix: string; name: string }[] = [
  { prefix: "/invoices/new", name: "New Invoice" },
  { prefix: "/invoices", name: "Invoices" },
  { prefix: "/clients", name: "Clients" },
  { prefix: "/products", name: "Products" },
  { prefix: "/company", name: "Company" },
  { prefix: "/dashboard", name: "Dashboard" },
];

function getBrand(pathname: string) {
  const match = pageNames.find((p) =>
    p.prefix === "/dashboard"
      ? pathname === p.prefix
      : pathname.startsWith(p.prefix),
  );
  return match?.name ?? "Dashboard";
}

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { logoUrl } = useCompany();

  const isActive = (href: string, exact: boolean) =>
    exact ? pathname === href : pathname.startsWith(href);

  const menuButton = ({
    href,
    label,
    icon: Icon,
    exact,
  }: (typeof NAV_MAIN)[number]) => (
    <SidebarMenuItem key={href}>
      <SidebarMenuButton
        tooltip={label}
        isActive={isActive(href, exact)}
        render={<Link href={href} />}
      >
        <Icon />
        <span>{label}</span>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );

  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 65)",
        } as React.CSSProperties
      }
    >
      <Sidebar collapsible="icon">
        <SidebarHeader>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton size="lg" render={<Link href="/dashboard" />}>
                {logoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={logoUrl}
                    alt=""
                    className="size-8 shrink-0 rounded-md object-contain"
                  />
                ) : (
                  <Image
                    src="/images/logo/nci.svg"
                    alt=""
                    width={32}
                    height={32}
                    unoptimized
                    className="size-8 shrink-0 rounded-md"
                  />
                )}
                <span className="truncate font-medium">Cloud Invoice</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarHeader>

        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu>{NAV_MAIN.map(menuButton)}</SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>

        <SidebarFooter>
          <SidebarMenu>
            {NAV_SECONDARY.map(menuButton)}
            <SidebarMenuItem>
              <SidebarMenuButton
                tooltip="Sign Out"
                onClick={() => signOut({ callbackUrl: "/login" })}
              >
                <LogOut />
                <span>Sign Out</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
      </Sidebar>

      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator
            orientation="vertical"
            className="mr-2 data-[orientation=vertical]:h-4"
          />
          <Breadcrumb className="hidden sm:block">
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink render={<Link href="/dashboard" />}>
                  Cloud Invoice
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>{getBrand(pathname)}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>

          <div className="ml-auto flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              nativeButton={false}
              render={<Link href="/company" />}
            >
              <Settings />
              <span className="sr-only">Settings</span>
            </Button>
          </div>
        </header>
        <main className="flex-1">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}
