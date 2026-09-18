import type { Metadata } from "next";
import {
  ArrowRight,
  Boxes,
  Download,
  GitBranch,
  HardDrive,
  Shield,
  Zap,
} from "lucide-react";
import Link from "next/link";

import { buttonVariants } from "@site/components/ui/button";
import { cn } from "@site/lib/utils";
import { Badge } from "@site/components/ui/badge";
import { formatDate, getReleases, type GitHubRelease } from "@site/lib/github";
import { GITHUB_DISCUSSIONS_URL, GITHUB_RELEASES_URL } from "@site/lib/site";

export const metadata: Metadata = {
  title: "Download | Cloud Invoice",
  description:
    "Download Cloud Invoice, an open-source, self-hosted invoice manager. Two release channels: stable and insider.",
  openGraph: {
    title: "Download | Cloud Invoice",
    description:
      "Download Cloud Invoice, an open-source, self-hosted invoice manager.",
    type: "website",
  },
};

export const dynamic = "force-static";

interface ReleaseCard {
  release?: GitHubRelease;
  title: string;
  badge: string;
  description: string;
  recommended?: boolean;
}

function latestZip(release: GitHubRelease): string {
  return release.zipball_url;
}

function downloadName(release: GitHubRelease): string {
  return `nci-${release.tag_name.replace(/^v/, "")}.zip`;
}

function ReleaseCard({
  release,
  title,
  badge,
  description,
  recommended,
}: ReleaseCard & { recommended?: boolean }) {
  if (!release) {
    return (
      <div className="border-border bg-card flex flex-col gap-4 rounded-2xl border p-6">
        <Badge>{badge}</Badge>
        <h2 className="text-xl font-semibold">{title}</h2>
        <p className="text-muted-foreground text-sm text-pretty">
          {description}
        </p>
        <p className="text-muted-foreground text-sm">No releases yet.</p>
      </div>
    );
  }

  return (
    <div
      className={
        recommended
          ? "border-primary bg-card relative flex flex-col gap-4 rounded-2xl border-2 p-6"
          : "border-border bg-card flex flex-col gap-4 rounded-2xl border p-6"
      }
    >
      {recommended ? (
        <Badge className="absolute -top-3 left-6">{badge}</Badge>
      ) : (
        <Badge variant="outline" className="w-fit">
          {badge}
        </Badge>
      )}
      <div>
        <h2 className="text-xl font-bold">{title}</h2>
        <p className="text-muted-foreground mt-1 text-sm">
          {release.tag_name.replace(/^v/, "")} · Released{" "}
          {formatDate(release.published_at)}
        </p>
      </div>
      <p className="text-muted-foreground text-sm text-pretty">{description}</p>
      <div className="mt-auto flex flex-wrap items-center gap-2">
        <a
          href={latestZip(release)}
          download={downloadName(release)}
          className={cn(buttonVariants({ size: "default" }))}
        >
          <Download />
          Download {release.tag_name.replace(/^v/, "")}
        </a>
        <a
          href={release.html_url}
          target="_blank"
          rel="noopener noreferrer"
          className={cn(buttonVariants({ variant: "ghost" }))}
        >
          <ArrowRight />
          Changelog
        </a>
      </div>
    </div>
  );
}

export default async function DownloadPage() {
  const releases = await getReleases();

  const stable = releases.find((r) => !r.prerelease);
  const insider = releases.find((r) => r.prerelease);

  const channels: ReleaseCard[] = [
    {
      release: stable,
      title: "Stable",
      badge: "Recommended",
      description:
        "Production-ready releases. Tested, documented, and safe for business-critical use.",
      recommended: true,
    },
    {
      release: insider,
      title: "Insider",
      badge: "Early access",
      description:
        "Previews of the next release. New features land here first — great for testing and feedback.",
    },
  ];

  return (
    <>
      <section className="mx-auto w-full max-w-6xl px-4 pt-16 pb-4 md:pt-24">
        <div className="mx-auto max-w-2xl text-center">
          <h1 className="text-4xl font-extrabold tracking-tight text-balance sm:text-5xl">
            Get Cloud Invoice running in minutes
          </h1>
          <p className="text-muted-foreground mt-4 text-lg text-pretty">
            Self-hosted, open source, free forever. Two release channels:
            rock-solid stable, or bleeding-edge insider for early adopters.
          </p>
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-4 py-12">
        <div className="grid gap-6 md:grid-cols-2">
          {channels.map((c) => (
            <ReleaseCard key={c.title} {...c} />
          ))}
        </div>
        <div className="mt-6 text-center">
          <Link
            href={GITHUB_RELEASES_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary text-sm font-medium hover:underline"
          >
            Looking for a specific version? Browse all releases →
          </Link>
        </div>
      </section>

      <section className="border-border border-t">
        <div className="mx-auto w-full max-w-6xl px-4 py-16">
          <div className="mb-10 text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Up and running with Docker
            </h2>
            <p className="text-muted-foreground mt-3 max-w-xl text-pretty sm:mx-auto">
              The fastest way to self-host — pull the official image and run it
              with a single command. Requires a PostgreSQL database.
            </p>
          </div>

          <div className="border-border bg-card rounded-2xl border p-6">
            <div className="mb-4 flex items-center gap-2">
              <Boxes className="text-primary size-5" />
              <h3 className="text-lg font-semibold">Quick start with Docker</h3>
            </div>
            <pre className="overflow-x-auto font-mono text-sm">
              <code>
                {`docker pull ghcr.io/${""}nexausm/ci:latest

# persistent storage so your data lives outside the container
docker run -d --name cloud-invoice \\
  -p 3000:3000 \\
  -e DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/DBNAME?schema=public" \\
  ghcr.io/nexausm/ci:latest`}
              </code>
            </pre>
            <p className="text-muted-foreground mt-4 text-sm">
              Replace the image tag with a pinned release like{" "}
              <code className="text-foreground font-mono">:v1.0.0</code> for
              reproducible installs. Full instructions live in the
              documentation.
            </p>
          </div>
        </div>
      </section>

      <section className="border-border bg-card/50 border-t">
        <div className="mx-auto w-full max-w-6xl px-4 py-16">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            What you&apos;ll need
          </h2>
          <p className="text-muted-foreground mt-3 text-pretty">
            Cloud Invoice runs on any standard stack. Nothing exotic.
          </p>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                icon: Zap,
                title: "Runtime",
                items: "Node.js 22+ with the standard npm toolchain.",
              },
              {
                icon: HardDrive,
                title: "Database",
                items: "PostgreSQL 15+ — the only required service.",
              },
              {
                icon: Shield,
                title: "Hardware",
                items:
                  "From a Raspberry Pi to a server. Lightweight, not demanding.",
              },
              {
                icon: GitBranch,
                title: "Deploy",
                items:
                  "Docker, VPS or your own laptop — anywhere a modern browser lives.",
              },
            ].map((r) => (
              <div
                key={r.title}
                className="border-border bg-background rounded-xl border p-5"
              >
                <r.icon className="text-primary size-5" />
                <h3 className="mt-3 text-base font-semibold">{r.title}</h3>
                <p className="text-muted-foreground mt-1 text-sm text-pretty">
                  {r.items}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-border border-t">
        <div className="mx-auto w-full max-w-6xl px-4 py-16 text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Need help getting started?
          </h2>
          <p className="text-muted-foreground mt-3 max-w-xl text-pretty sm:mx-auto">
            Join the community — someone has probably already solved what
            you&apos;re stuck on.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <a
              href={GITHUB_DISCUSSIONS_URL}
              target="_blank"
              rel="noopener noreferrer"
              className={cn(buttonVariants({ size: "lg" }))}
            >
              <GitBranch />
              GitHub Discussions
            </a>
            <Link
              href="/docs"
              className={cn(buttonVariants({ variant: "outline", size: "lg" }))}
            >
              Read the docs
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
