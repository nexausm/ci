"use client";
import { MenuIcon, XIcon } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { IoLogoGithub } from "react-icons/io";

import { ThemeToggle } from "@site/components/landing/theme-toggle";
import { GITHUB_REPO_URL } from "@site/lib/site";

import { navlinks } from "./data/navlinks";
import { INavLink } from "./types";

function BrandMark() {
  return (
    <span className="inline-flex items-center gap-2.5">
      <Image
        src="/assets/logo/png/transparent/icononly/teal.png"
        alt="Cloud Invoice Logo"
        width={28}
        height={28}
      />
      <span className="text-foreground text-lg font-semibold tracking-tight">
        Cloud Invoice
      </span>
    </span>
  );
}

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen]);

  useEffect(() => {
    if (typeof document === "undefined") return;
    document.body.style.overflow = isOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(min-width: 1024px)");
    const onChange = (e: MediaQueryListEvent) => {
      if (e.matches) setIsOpen(false);
    };
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  useEffect(() => {
    if (!isOpen || typeof document === "undefined") return;
    const dialog = dialogRef.current;
    if (!dialog) return;

    const focusable = dialog.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
    );
    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    first?.focus();

    const trap = (e: KeyboardEvent) => {
      if (e.key !== "Tab") return;
      if (focusable.length === 0) {
        e.preventDefault();
        return;
      }
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last?.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first?.focus();
      }
    };

    document.addEventListener("keydown", trap);
    const trigger = triggerRef.current;
    return () => {
      document.removeEventListener("keydown", trap);
      trigger?.focus();
    };
  }, [isOpen]);

  const linkClass = (active: boolean) =>
    active
      ? "text-sm font-medium text-foreground transition-colors hover:text-primary"
      : "text-sm font-medium text-muted-foreground transition-colors hover:text-foreground";

  const renderLink = (link: INavLink, className: string) => {
    const onClick = () => setIsOpen(false);

    return link.external ? (
      <a
        key={link.name}
        href={link.href}
        target="_blank"
        rel="noopener noreferrer"
        onClick={onClick}
        className={className}
      >
        {link.name}
      </a>
    ) : (
      <Link
        key={link.name}
        href={link.href}
        onClick={onClick}
        className={className}
      >
        {link.name}
      </Link>
    );
  };

  const iconButton =
    "text-muted-foreground hover:text-foreground hover:bg-muted inline-flex size-9 items-center justify-center rounded-md transition-colors";

  return (
    <>
      <nav className="bg-background/80 border-border text-foreground fixed top-0 left-0 z-50 w-full border-b backdrop-blur-md">
        <div className="site-container flex items-center justify-between py-3.5">
          <Link
            href="/"
            aria-label="Cloud Invoice home"
            onClick={() => setIsOpen(false)}
            className="shrink-0"
          >
            <BrandMark />
          </Link>

          <div className="items-center gap-7 max-lg:hidden lg:flex">
            {navlinks.map((link: INavLink) =>
              renderLink(link, linkClass(link.name === "GitHub")),
            )}
          </div>

          <div className="flex items-center gap-1">
            <a
              href={GITHUB_REPO_URL}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Cloud Invoice on GitHub"
              className={iconButton}
            >
              <IoLogoGithub className="size-5" />
            </a>
            <ThemeToggle className={iconButton} />

            <button
              ref={triggerRef}
              type="button"
              aria-label="Open menu"
              aria-expanded={isOpen}
              onClick={() => setIsOpen(true)}
              className={`${iconButton} lg:hidden`}
            >
              <MenuIcon size={22} />
            </button>
          </div>
        </div>
      </nav>

      <div
        onClick={() => setIsOpen(false)}
        aria-hidden="true"
        className={`fixed inset-0 z-90 bg-black/60 backdrop-blur-sm transition-opacity duration-300 lg:hidden ${
          isOpen ? "visible opacity-100" : "invisible opacity-0"
        }`}
      />

      <aside
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label="Menu"
        className={`bg-background/95 border-border fixed top-0 right-0 z-100 flex h-dvh w-[82%] max-w-sm flex-col border-l shadow-2xl backdrop-blur transition-transform duration-300 lg:hidden ${
          isOpen ? "visible translate-x-0" : "invisible translate-x-full"
        }`}
      >
        <div className="border-border flex items-center justify-between border-b px-6 py-4">
          <BrandMark />
          <button
            type="button"
            aria-label="Close menu"
            onClick={() => setIsOpen(false)}
            className={iconButton}
          >
            <XIcon size={22} />
          </button>
        </div>

        <nav className="flex flex-col gap-1 overflow-y-auto px-4 py-6">
          {navlinks.map((link: INavLink) =>
            renderLink(
              link,
              "text-foreground hover:bg-muted block rounded-lg px-4 py-3 text-base font-medium transition-colors",
            ),
          )}
        </nav>

        <div className="border-border mt-auto border-t p-6">
          <Link
            href="/docs/quickstart"
            onClick={() => setIsOpen(false)}
            className="block w-full rounded-full bg-teal-800 px-6 py-3 text-center font-semibold text-white transition-colors hover:bg-teal-900 dark:hover:bg-teal-700"
          >
            Get started
          </Link>
        </div>
      </aside>
    </>
  );
}
