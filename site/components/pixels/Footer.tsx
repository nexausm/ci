import Link from "next/link";
import { IoLogoGithub } from "react-icons/io5";

import { GITHUB_REPO_URL } from "@site/lib/site";

import { footerData } from "./data/footer";
import { IFooterLink } from "./types";

export default function Footer() {
  return (
    <footer className="border-border text-muted-foreground mt-40 border-t py-6 text-sm">
      <div className="site-container">
        <div className="flex max-lg:flex-col max-lg:gap-10 lg:justify-between lg:gap-16">
          <nav className="grid gap-8 lg:grid-cols-3">
            {footerData.map((section) => (
              <ul key={section.title} className="space-y-2">
                {section.links.map((link: IFooterLink) => (
                  <li key={link.name}>
                    {link.external ? (
                      <a
                        href={link.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:text-primary transition-colors"
                      >
                        {link.name}
                      </a>
                    ) : (
                      <Link
                        href={link.href}
                        className="hover:text-primary transition-colors"
                      >
                        {link.name}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            ))}
          </nav>

          <div className="max-w-xs max-lg:order-first lg:ml-auto lg:text-right">
            <div className="flex gap-4 lg:justify-end">
              <a
                href={GITHUB_REPO_URL}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Cloud Invoice on GitHub"
                className="hover:text-primary text-muted-foreground transition-colors"
              >
                <IoLogoGithub className="size-5" />
              </a>
            </div>
            <p className="text-foreground mt-4 font-semibold">Cloud Invoice</p>
            <p className="mt-1 text-pretty">
              Open-source, self-hostable invoice manager. Your data stays on
              your own database.
            </p>
          </div>
        </div>

        <div className="border-border text-muted-foreground mt-10 border-t pt-6 text-center text-xs">
          <p>{new Date().getFullYear()} Cloud Invoice | AGPL-3.0</p>
        </div>
      </div>
    </footer>
  );
}
