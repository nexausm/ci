import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";

export type ServiceIcon = string;

export interface LandingContent {
  meta: {
    title: string;
    description: string;
  };
  hero: {
    badge: string;
    headline: string;
    subhead: string;
    ctaPrimary: string;
    ctaSecondary: string;
    githubUrl: string;
  };
  features: {
    icon: ServiceIcon;
    title: string;
    description: string;
  }[];
  getStarted: {
    steps: {
      title: string;
      code: string;
    }[];
    platforms: string;
  };
  openSource: {
    headline: string;
    description: string;
    githubUrl: string;
    contributingUrl: string;
  };
  footer: {
    copyright: string;
  };
}

const CONTENT_DIR = path.join(process.cwd(), "content");

export function getPageContent(slug: string): LandingContent {
  const filePath = path.join(CONTENT_DIR, `${slug}.md`);
  const raw = fs.readFileSync(filePath, "utf8");
  const { data } = matter(raw);
  return data as unknown as LandingContent;
}

export const GITHUB_REPO_URL =
  process.env.GITHUB_REPO_URL ?? "https://github.com/nexausm/ci";

export function getEditPath(slug: string) {
  return `${GITHUB_REPO_URL}/blob/main/content/${slug}.md`;
}
