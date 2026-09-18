"use client";

import { ArrowRight, Menu, X } from "lucide-react";
import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";

import { Logo } from "@site/components/landing/logo";
import { ThemeToggle } from "@site/components/landing/theme-toggle";

const NAV_ITEMS = [
  { href: "#features", label: "Features" },
  { href: "#self-host", label: "Self-host" },
  { href: "/docs", label: "Docs" },
];

export function SiteHeader() {
  const [open, setOpen] = useState(false);

  return (
    <header className="border-border bg-background/80 sticky top-0 z-50 border-b backdrop-blur-md">
      <nav className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between gap-4 px-4">
        <Link
          href="#"
          aria-label="Cloud Invoice home"
          onClick={() => setOpen(false)}
        >
          <Logo />
        </Link>

        <div className="flex items-center gap-2">
          <div className="hidden items-center gap-3 md:flex">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="text-muted-foreground hover:text-foreground text-sm font-medium transition-colors"
              >
                {item.label}
              </Link>
            ))}
            <Link
              href="#getting-started"
              className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-sm font-medium transition-colors"
            >
              Getting started <ArrowRight className="size-3.5" />
            </Link>
          </div>
          <ThemeToggle />
          <button
            type="button"
            aria-label="Toggle menu"
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
            className="text-muted-foreground hover:text-foreground inline-flex size-8 items-center justify-center rounded-md transition-colors md:hidden"
          >
            {open ? <X className="size-4" /> : <Menu className="size-4" />}
          </button>
        </div>
      </nav>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className="bg-background absolute inset-x-0 top-full z-100 overflow-hidden shadow-lg md:hidden"
          >
            <div className="border-border flex flex-col gap-1 border-t px-4 py-3">
              {NAV_ITEMS.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className="text-muted-foreground hover:text-foreground rounded-md px-2 py-2 text-sm font-medium transition-colors"
                >
                  {item.label}
                </Link>
              ))}
              <Link
                href="#getting-started"
                onClick={() => setOpen(false)}
                className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 rounded-md px-2 py-2 text-sm font-medium transition-colors"
              >
                Getting started <ArrowRight className="size-3.5" />
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
