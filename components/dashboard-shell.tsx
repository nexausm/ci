"use client";

import { useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  Bell,
  Building2,
  LayoutGrid,
  LogOut,
  Plus,
  Search,
  Settings,
} from "lucide-react";
import { FaUserFriends } from "react-icons/fa";
import { BiSolidLayout } from "react-icons/bi";
import { AiFillProduct } from "react-icons/ai";

const navItems = [
  { href: "/", label: "Dashboard", icon: BiSolidLayout, exact: true },
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
  { prefix: "/", name: "Dashboard" },
];

function getBrand(pathname: string) {
  const match = pageNames.find((p) =>
    p.prefix === "/" ? pathname === "/" : pathname.startsWith(p.prefix),
  );
  return match ? match.name : "Dashboard";
}

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  useEffect(() => {
    document.documentElement.classList.remove("paper-nav-open");
  }, [pathname]);

  const isActive = (href: string, exact: boolean) =>
    exact ? pathname === href : pathname.startsWith(href);

  const toggleSidebar = () => {
    document.documentElement.classList.toggle("paper-nav-open");
  };

  const handleSignOut = () => {
    document.documentElement.classList.remove("paper-nav-open");
    signOut({ callbackUrl: "/login" });
  };

  return (
    <>
      <aside className="paper-sidebar">
        <div className="paper-logo">
          <span className="paper-logo-mini">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/logo/main.png"
              alt="Billing"
              onError={(e) => {
                e.currentTarget.style.display = "none";
              }}
            />
          </span>
          <Link href="/" className="paper-logo-normal paper-simple-text">
            Billing
          </Link>
        </div>
        <div className="paper-sidebar-wrapper">
          <ul className="paper-nav">
            {navItems.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={
                    "paper-nav-link" +
                    (isActive(item.href, item.exact) ? " active" : "")
                  }
                >
                  <span className="paper-nav-icon">
                    <item.icon />
                  </span>
                  <p>{item.label}</p>
                </Link>
              </li>
            ))}
          </ul>
          <ul className="paper-nav">
            {footNavItems.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={
                    "paper-nav-link" +
                    (isActive(item.href, item.exact) ? " active" : "")
                  }
                >
                  <span className="paper-nav-icon">
                    <item.icon />
                  </span>
                  <p>{item.label}</p>
                </Link>
              </li>
            ))}
            <li>
              <button
                type="button"
                className="paper-nav-link"
                onClick={handleSignOut}
              >
                <span className="paper-nav-icon">
                  <LogOut />
                </span>
                <p>Sign Out</p>
              </button>
            </li>
          </ul>
        </div>
      </aside>
      <div className="paper-main-panel">
        <header className="paper-topbar">
          <div className="paper-topbar-inner">
            <div className="paper-topbar-wrapper">
              <div className="navbar-toggle">
                <button
                  type="button"
                  className="navbar-toggler"
                  onClick={toggleSidebar}
                  aria-label="Toggle sidebar"
                >
                  <span className="navbar-toggler-bar bar1" />
                  <span className="navbar-toggler-bar bar2" />
                  <span className="navbar-toggler-bar bar3" />
                </button>
              </div>
              <span className="navbar-brand">{getBrand(pathname)}</span>
            </div>
            <div className="paper-topbar-right">
              <form
                className="paper-search"
                onSubmit={(e) => e.preventDefault()}
              >
                <div className="paper-search-group">
                  <Search className="paper-search-icon" size={16} />
                  <input
                    type="text"
                    className="paper-search-input"
                    placeholder="Search..."
                    aria-label="Search"
                  />
                </div>
              </form>
              <nav className="paper-topbar-nav">
                <Link
                  href="/invoices"
                  className="paper-link-icon"
                  aria-label="Invoices"
                >
                  <LayoutGrid size={16} />
                </Link>
                <button
                  type="button"
                  className="paper-link-icon paper-hide-mobile"
                  aria-label="Notifications"
                >
                  <Bell size={16} />
                </button>
                <button
                  type="button"
                  className="paper-link-icon paper-hide-mobile"
                  aria-label="Settings"
                >
                  <Settings size={16} />
                </button>
              </nav>
            </div>
          </div>
        </header>
        <main className="paper-content">{children}</main>
      </div>
    </>
  );
}
