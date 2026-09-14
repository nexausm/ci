import { ArrowRight } from "lucide-react";
import Link from "next/link";

import { Logo } from "@site/components/landing/logo";
import { ThemeToggle } from "@site/components/landing/theme-toggle";

export function SiteHeader() {
  return (
    <header className="border-border bg-background/80 sticky top-0 z-50 border-b backdrop-blur-md">
      <nav className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between gap-4 px-4">
        <Link href="#" aria-label="Cloud Invoice home">
          <Logo />
        </Link>

        <div className="flex items-center gap-2">
          <div className="hidden items-center gap-3 md:flex">
            <Link
              href="#features"
              className="text-muted-foreground hover:text-foreground text-sm font-medium transition-colors"
            >
              Features
            </Link>
            <Link
              href="#self-host"
              className="text-muted-foreground hover:text-foreground text-sm font-medium transition-colors"
            >
              Self-host
            </Link>
            <Link
              href="#getting-started"
              className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-sm font-medium transition-colors"
            >
              Getting started <ArrowRight className="size-3.5" />
            </Link>
          </div>
          <ThemeToggle />
        </div>
      </nav>
    </header>
  );
}
