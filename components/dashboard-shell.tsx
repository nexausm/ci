"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { useCompany } from "@/app/providers/company-provider";
import { Building2, LogOut, Plus, Settings } from "lucide-react";
import { FaUserFriends } from "react-icons/fa";
import { BiSolidLayout } from "react-icons/bi";
import { AiFillProduct } from "react-icons/ai";
import { AlgoliaSearch } from "@/components/custom/algolia-search";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: BiSolidLayout, exact: true },
  { href: "/clients", label: "Clients", icon: FaUserFriends, exact: false },
  { href: "/products", label: "Products", icon: AiFillProduct, exact: false },
  { href: "/company", label: "Company", icon: Building2, exact: false },
];

const footNavItems = [
  { href: "/invoices/new", label: "New Invoice", icon: Plus, exact: false },
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
  return match ? match.name : "Dashboard";
}

const EASE = "ease-[cubic-bezier(0.685,0.0473,0.346,1)]";

function navLinkClass(active: boolean) {
  return cn(
    "group/nav mx-[15px] mt-2.5 flex w-[calc(100%_-_30px)] items-center bg-transparent px-2 py-2.5 text-left text-xs uppercase leading-[30px]",
    active
      ? "text-[#51bcda]"
      : "text-white opacity-70 hover:text-white hover:opacity-100",
  );
}

function navIconClass(active: boolean) {
  return cn(
    "mr-3 inline-flex w-[34px] shrink-0 items-center justify-center text-center text-2xl leading-[30px]",
    active ? "text-[#51bcda]" : "text-white/50 group-hover/nav:text-white/75",
  );
}

export function DashboardShell({
  children,
  algolia,
}: {
  children: React.ReactNode;
  algolia?: { appId: string; searchKey: string; indexName: string };
}) {
  const pathname = usePathname();
  const { logoUrl } = useCompany();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    document.body.style.overflowX = sidebarOpen ? "hidden" : "";
    return () => {
      document.body.style.overflowX = "";
    };
  }, [sidebarOpen]);

  const isActive = (href: string, exact: boolean) =>
    exact ? pathname === href : pathname.startsWith(href);

  const handleSignOut = () => {
    setSidebarOpen(false);
    signOut({ callbackUrl: "/login" });
  };

  return (
    <>
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-1030 flex h-full w-65 flex-col overflow-hidden border-r border-[#ddd] bg-[#212120] transition-[transform,visibility] duration-500",
          EASE,
          sidebarOpen
            ? "visible translate-x-0"
            : "invisible -translate-x-65 lg:visible lg:translate-x-0",
        )}
      >
        <div className="relative z-4 flex shrink-0 items-center px-[0.7rem] py-1.75 after:absolute after:inset-x-3.75 after:bottom-0 after:h-px after:bg-white/50 after:content-['']">
          <span className="mr-3 ml-2.5 w-8.5 shrink-0 text-center">
            {logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={logoUrl}
                alt="Logo"
                className="inline-block max-h-9 max-w-8.5 align-middle"
                onError={(e) => {
                  e.currentTarget.style.display = "none";
                }}
              />
            ) : (
              <Image
                src="/images/logo/nci.svg"
                alt="nci"
                width={115}
                height={127}
                unoptimized
                className="inline-block max-h-9 max-w-8.5 align-middle"
              />
            )}
          </span>
          <Link
            href="/dashboard"
            className="block overflow-hidden py-2 text-base leading-7.5 font-normal whitespace-nowrap text-white uppercase no-underline"
            onClick={() => setSidebarOpen(false)}
          >
            Cloud Invoice
          </Link>
        </div>

        <div className="relative z-4 h-[calc(100vh-75px)] flex-1 overflow-x-hidden overflow-y-auto pb-25">
          <ul className="m-0 mt-5 list-none p-0">
            {navItems.map((item) => {
              const active = isActive(item.href, item.exact);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={navLinkClass(active)}
                    onClick={() => setSidebarOpen(false)}
                  >
                    <span className={navIconClass(active)}>
                      <item.icon />
                    </span>
                    <p>{item.label}</p>
                  </Link>
                </li>
              );
            })}
          </ul>

          <ul className="m-0 mt-2.5 list-none p-0">
            {footNavItems.map((item) => {
              const active = isActive(item.href, item.exact);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={navLinkClass(active)}
                    onClick={() => setSidebarOpen(false)}
                  >
                    <span className={navIconClass(active)}>
                      <item.icon />
                    </span>
                    <p>{item.label}</p>
                  </Link>
                </li>
              );
            })}
            <li>
              <button
                type="button"
                className={navLinkClass(false)}
                onClick={handleSignOut}
              >
                <span className={navIconClass(false)}>
                  <LogOut />
                </span>
                <p>Sign Out</p>
              </button>
            </li>
          </ul>
        </div>
      </aside>

      <div
        className={cn(
          "relative min-h-screen bg-[#f4f3ef] transition-transform duration-500 lg:ml-65",
          EASE,
          sidebarOpen && "max-lg:translate-x-65",
        )}
      >
        <header className="sticky top-0 z-1029 mb-5 min-h-13.25 border-b border-[#ddd] bg-[#f4f3ef] py-2.5">
          <div className="flex items-center gap-4 px-3.75">
            <div className="inline-flex items-center">
              <button
                type="button"
                className="inline-flex h-6.75 w-9.25 cursor-pointer flex-col justify-center border-0 bg-transparent p-0 align-middle"
                onClick={() => setSidebarOpen((open) => !open)}
                aria-label="Toggle sidebar"
              >
                <span className="block h-px w-5.5 rounded-[1px] bg-[#66615b]" />
                <span className="mt-1.75 block h-px w-4.25 rounded-[1px] bg-[#66615b]" />
                <span className="mt-1.75 block h-px w-5.5 rounded-[1px] bg-[#66615b]" />
              </button>
              <span className="ml-2 py-2 text-base leading-6.5 font-normal text-[#66615b] capitalize lg:text-xl">
                {getBrand(pathname)}
              </span>
            </div>
            <div className="ml-auto flex items-center gap-2">
              {algolia ? (
                <AlgoliaSearch
                  appId={algolia.appId}
                  searchKey={algolia.searchKey}
                  indexName={algolia.indexName}
                />
              ) : null}
              <nav className="flex items-center">
                <button
                  type="button"
                  className="inline-flex cursor-pointer items-center justify-center border-0 bg-transparent px-[0.7rem] py-2 text-[0.7142em] leading-6.5 text-[#66615b] uppercase max-lg:hidden"
                  aria-label="Settings"
                >
                  <Settings size={16} />
                </button>
              </nav>
            </div>
          </div>
        </header>
        <main className="flex-1">{children}</main>
      </div>
    </>
  );
}
