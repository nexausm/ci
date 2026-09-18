import type { Metadata } from "next";
import {
  Bug,
  GitBranch,
  GitPullRequest,
  Heart,
  MessagesSquare,
  ScrollText,
} from "lucide-react";
import { FaGithub } from "react-icons/fa";

import { buttonVariants } from "@site/components/ui/button";
import { cn } from "@site/lib/utils";
import {
  GITHUB_DISCUSSIONS_URL,
  GITHUB_ISSUES_URL,
  GITHUB_RELEASES_URL,
  GITHUB_REPO_URL,
} from "@site/lib/site";

export const metadata: Metadata = {
  title: "Community | Cloud Invoice",
  description:
    "Join the Cloud Invoice community on GitHub — open issues, feel free to contribute, report bugs and discuss features.",
  openGraph: {
    title: "Community | Cloud Invoice",
    description:
      "Join the Cloud Invoice community on GitHub — contribute, report bugs and discuss features.",
    type: "website",
  },
};

const channels = [
  {
    icon: MessagesSquare,
    title: "Discussions",
    description:
      "Ask questions, share setups and talk through workflows with other users.",
    href: GITHUB_DISCUSSIONS_URL,
    cta: "Start a discussion",
  },
  {
    icon: GitPullRequest,
    title: "Contributions",
    description:
      "The whole codebase is open under AGPL-3.0. Pick an issue, fork and open a pull request.",
    href: `${GITHUB_REPO_URL}/pulls`,
    cta: "Open a pull request",
  },
  {
    icon: Bug,
    title: "Bug reports",
    description:
      "Found a bug? Search the tracker first, then open an issue with a clear repro.",
    href: GITHUB_ISSUES_URL,
    cta: "Report a bug",
  },
  {
    icon: ScrollText,
    title: "Release notes",
    description:
      "Follow every release on GitHub to see what changed, in every version.",
    href: GITHUB_RELEASES_URL,
    cta: "Browse releases",
  },
];

export default function CommunityPage() {
  return (
    <>
      <section className="mx-auto w-full max-w-6xl px-4 pt-16 pb-4 md:pt-24">
        <div className="mx-auto max-w-2xl text-center">
          <h1 className="text-4xl font-extrabold tracking-tight text-balance sm:text-5xl">
            Built in the open, together
          </h1>
          <p className="text-muted-foreground mt-4 text-lg text-pretty">
            Cloud Invoice is a personal project, not a company. It lives on
            GitHub — and every contribution, report and discussion makes it
            better.
          </p>
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-4 py-12">
        <div className="grid gap-4 sm:grid-cols-2">
          {channels.map((c) => (
            <div
              key={c.title}
              className="border-border bg-card flex flex-col gap-4 rounded-2xl border p-6"
            >
              <span className="bg-primary/10 text-primary inline-flex size-11 shrink-0 items-center justify-center rounded-xl">
                <c.icon className="size-6" />
              </span>
              <div>
                <h2 className="text-lg font-semibold">{c.title}</h2>
                <p className="text-muted-foreground mt-1 text-sm text-pretty">
                  {c.description}
                </p>
              </div>
              <a
                href={c.href}
                target="_blank"
                rel="noopener noreferrer"
                className={cn(
                  buttonVariants({ variant: "outline" }),
                  "mt-auto w-fit",
                )}
              >
                <GitBranch />
                {c.cta}
              </a>
            </div>
          ))}
        </div>
      </section>

      <section className="border-border bg-card/50 border-t">
        <div className="mx-auto w-full max-w-6xl px-4 py-16">
          <div className="grid items-center gap-10 md:grid-cols-2">
            <div>
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                The project&apos;s GitHub
              </h2>
              <p className="text-muted-foreground mt-3 text-pretty">
                Everything lives in one repository: source, issues, discussions
                and releases. Check the stars, `watch` the repo, or just read
                the code.
              </p>
              <a
                href={GITHUB_REPO_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="border-border bg-background hover:bg-muted mt-8 inline-flex items-center gap-2 rounded-full border px-5 py-2.5 text-sm font-semibold transition-colors"
              >
                <FaGithub className="size-4" />
                View on GitHub
              </a>
            </div>

            <div className="border-border bg-background rounded-2xl border p-5">
              <pre className="overflow-x-auto font-mono text-sm whitespace-pre-wrap">
                <code>{`git clone https://github.com/nexausm/ci
cd ci
npm install
npm run dev`}</code>
              </pre>
            </div>
          </div>
        </div>
      </section>

      <section className="border-border border-t">
        <div className="mx-auto w-full max-w-6xl px-4 py-16 text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Share the load, keep it free
          </h2>
          <p className="text-muted-foreground mt-3 max-w-xl text-pretty sm:mx-auto">
            Cloud Invoice is free to use and will never advertise inside your
            invoices. If it saves you time, the best thanks is a contribution
            upstream.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <a
              href={`${GITHUB_REPO_URL}/pulls`}
              target="_blank"
              rel="noopener noreferrer"
              className={cn(buttonVariants({ size: "lg" }))}
            >
              <Heart />
              Contribute
            </a>
            <a
              href={GITHUB_DISCUSSIONS_URL}
              target="_blank"
              rel="noopener noreferrer"
              className={cn(buttonVariants({ variant: "outline", size: "lg" }))}
            >
              <MessagesSquare />
              Join Discussions
            </a>
          </div>
        </div>
      </section>
    </>
  );
}
