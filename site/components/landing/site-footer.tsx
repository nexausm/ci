import { FaGithub } from "react-icons/fa";

import { Logo } from "@site/components/landing/logo";
import { GITHUB_REPO_URL } from "@site/lib/site";

export function SiteFooter() {
  return (
    <footer className="border-border bg-card/50 border-t">
      <div className="mx-auto flex w-full max-w-6xl flex-col items-center justify-between gap-4 px-4 py-8 sm:flex-row">
        <Logo />
        <div className="flex items-center gap-4">
          <a
            href={GITHUB_REPO_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="text-muted-foreground hover:text-foreground inline-flex items-center gap-2 text-sm font-medium transition-colors"
          >
            <FaGithub className="size-4" />
            Source
          </a>
          <span className="text-muted-foreground text-sm">
            © {new Date().getFullYear()} NCI | AGPL-3.0
          </span>
        </div>
      </div>
    </footer>
  );
}
