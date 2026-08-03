"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Plus, Users } from "lucide-react";
import { FaUserFriends } from "react-icons/fa";
import { BiSolidLayout } from "react-icons/bi";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar";

const links = [
  { href: "/", label: "Dashboard", icon: BiSolidLayout, exact: true },
  { href: "/clients", label: "Clients", icon: FaUserFriends, exact: false },
];

export function AppSidebar() {
  const pathname = usePathname();

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" render={<Link href="/" />}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/logo/main.png"
                alt="Billing"
                className="h-6 w-auto shrink-0 group-data-[collapsible=icon]:hidden"
              />
              <span className="group-data-[collapsible=icon]:hidden">
                Billing
              </span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Overview</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {links.map((link) => {
                const active = link.exact
                  ? pathname === link.href
                  : pathname.startsWith(link.href);
                return (
                  <SidebarMenuItem key={link.href}>
                    <SidebarMenuButton
                      render={<Link href={link.href} />}
                      isActive={active}
                    >
                      <link.icon />
                      <span>{link.label}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              variant="outline"
              render={<Link href="/invoices/new" />}
            >
              <Plus />
              <span>New invoice</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
