import { readFileSync } from "node:fs";
import { join } from "node:path";

import Link from "next/link";
import { FaGithub } from "react-icons/fa";

import { Logo } from "@site/components/landing/logo";
import { GITHUB_DISCUSSIONS_URL, GITHUB_REPO_URL } from "@site/lib/site";

const APP_VERSION = JSON.parse(
  readFileSync(join(process.cwd(), "..", "package.json"), "utf8"),
).version as string;

const product = [
  { href: "/features", label: "Features" },
  { href: "/download", label: "Download" },
  { href: "/docs", label: "Documentation" },
];

const community = [
  { href: "/community", label: "Community" },
  { href: GITHUB_DISCUSSIONS_URL, label: "GitHub Discussions", external: true },
  { href: GITHUB_REPO_URL, label: "GitHub", external: true },
];

export function SiteFooter() {
  return (
    <footer className="border-border bg-card/50 border-t">
      <div className="mx-auto w-full max-w-6xl px-4 py-10">
        <div className="flex flex-col justify-between gap-8 md:flex-row">
          <div className="max-w-sm">
            <Logo />
            <p className="text-muted-foreground mt-3 text-sm text-pretty">
              Open-source, self-hostable invoice manager. Own your data, get
              paid on time.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-8 sm:gap-16">
            <div>
              <p className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
                Product
              </p>
              <ul className="mt-3 space-y-2">
                {product.map((l) => (
                  <li key={l.href}>
                    <Link
                      href={l.href}
                      className="text-muted-foreground hover:text-foreground text-sm transition-colors"
                    >
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
                Community
              </p>
              <ul className="mt-3 space-y-2">
                {community.map((l) => (
                  <li key={l.href}>
                    {l.external ? (
                      <a
                        href={l.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-muted-foreground hover:text-foreground text-sm transition-colors"
                      >
                        {l.label}
                      </a>
                    ) : (
                      <Link
                        href={l.href}
                        className="text-muted-foreground hover:text-foreground text-sm transition-colors"
                      >
                        {l.label}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
        <div className="border-border mt-10 flex flex-col items-center justify-between gap-4 border-t pt-6 sm:flex-row">
          <span className="text-muted-foreground text-sm">
            © {new Date().getFullYear()} NCI | AGPL-3.0 | v{APP_VERSION}
          </span>
          <a
            href={GITHUB_REPO_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="text-muted-foreground hover:text-foreground inline-flex items-center gap-2 text-sm font-medium transition-colors"
          >
            <FaGithub className="size-4" />
            Source
          </a>
        </div>
      </div>
    </footer>
  );
}
