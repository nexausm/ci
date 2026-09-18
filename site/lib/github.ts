import { GITHUB_OWNER, GITHUB_REPO } from "@site/lib/site";

export interface GitHubAsset {
  name: string;
  size: number;
  download_count: number;
  browser_download_url: string;
}

export interface GitHubRelease {
  tag_name: string;
  name: string;
  draft: boolean;
  prerelease: boolean;
  published_at: string;
  html_url: string;
  body: string;
  zipball_url: string;
  assets: GitHubAsset[];
}

const DAY = 60 * 60 * 24;

function isGitHubRelease(value: unknown): value is GitHubRelease {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return false;
  }
  const release = value as Record<string, unknown>;
  return (
    typeof release.tag_name === "string" &&
    typeof release.name === "string" &&
    typeof release.draft === "boolean" &&
    typeof release.prerelease === "boolean" &&
    typeof release.published_at === "string" &&
    typeof release.html_url === "string" &&
    typeof release.body === "string" &&
    typeof release.zipball_url === "string" &&
    Array.isArray(release.assets)
  );
}

export async function getReleases(): Promise<GitHubRelease[]> {
  let res: Response;
  try {
    res = await fetch(
      `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/releases`,
      {
        headers: {
          Accept: "application/vnd.github+json",
          "User-Agent": `${GITHUB_OWNER}-site`,
        },
        next: { revalidate: DAY },
      },
    );
  } catch {
    return [];
  }

  if (!res.ok) return [];

  let releases: unknown;
  try {
    releases = await res.json();
  } catch {
    return [];
  }

  if (!Array.isArray(releases)) return [];

  return releases.filter(isGitHubRelease).filter((r) => !r.draft);
}

export function formatDate(date: string): string {
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date(date));
}

export function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 ** 2) return `${(bytes / 1024).toFixed(0)} KB`;
  if (bytes < 1024 ** 3) return `${(bytes / 1024 ** 2).toFixed(1)} MB`;
  return `${(bytes / 1024 ** 3).toFixed(1)} GB`;
}
