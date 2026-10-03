import type { Metadata } from "next";
import { ArrowRight, Download } from "lucide-react";
import Link from "next/link";

import { buttonVariants } from "@site/components/ui/button";
import { cn } from "@site/lib/utils";
import { Badge } from "@site/components/ui/badge";
import { formatDate, getReleases, type GitHubRelease } from "@site/lib/github";
import { GITHUB_REPO_URL } from "@site/lib/site";

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
  return `cloud-invoice-${release.tag_name.replace(/^v/, "")}-source.zip`;
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
      <section className="mx-auto mt-16 w-full max-w-6xl px-4 pt-16 pb-4 md:pt-24">
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
            href={`${GITHUB_REPO_URL}/releases`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary text-sm font-medium hover:underline"
          >
            Looking for a specific version? Browse all releases →
          </Link>
        </div>
      </section>
    </>
  );
}
