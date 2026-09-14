import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import { compile, run } from "@mdx-js/mdx";
import * as JsxRuntime from "react/jsx-runtime";
import remarkGfm from "remark-gfm";
import { rehypeCode } from "fumadocs-core/mdx-plugins";
import { remarkHeading } from "fumadocs-core/mdx-plugins/remark-heading";
import { remarkNpm } from "fumadocs-core/mdx-plugins/remark-npm";
import defaultMdxComponents from "fumadocs-ui/mdx";
import { Accordion, Accordions } from "fumadocs-ui/components/accordion";
import { File, Files, Folder } from "fumadocs-ui/components/files";
import { Heading } from "fumadocs-ui/components/heading";
import { Steps, Step } from "fumadocs-ui/components/steps";
import { Tab, Tabs } from "fumadocs-ui/components/tabs";
import { TypeTable } from "fumadocs-ui/components/type-table";
import {
  TbApi,
  TbBraces,
  TbCompass,
  TbFileText,
  TbGitFork,
  TbSparkles,
} from "react-icons/tb";
import { IoPeople } from "react-icons/io5";
import { MdRocketLaunch } from "react-icons/md";
import type { IconType } from "react-icons";
import { HiSparkles } from "react-icons/hi2";
import React, { type ReactNode } from "react";
import type { TOCItemType } from "fumadocs-core/toc";
import type { ComponentType } from "react";
import type {
  Folder as PageTreeFolder,
  Item as PageTreeItem,
  Node as PageTreeNode,
  Root as PageTreeRoot,
} from "fumadocs-core/page-tree";
import { GITHUB_REPO_URL } from "@site/lib/site";

export interface DocMeta {
  slug: string[];
  url: string;
  title: string;
  description?: string;
  icon?: string;
  filePath: string;
  lastModified: string;
}

interface PageRecord extends DocMeta {
  content: string;
}

const DOCS_DIR = path.join(process.cwd(), "content/docs");

function walk(dir: string): string[] {
  const files: string[] = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const absolute = path.join(dir, entry.name);
    if (entry.isDirectory()) files.push(...walk(absolute));
    else if (/\.mdx?$/.test(entry.name)) files.push(absolute);
  }
  return files;
}

function humanize(segment: string): string {
  return segment
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function loadPages(): PageRecord[] {
  return walk(DOCS_DIR)
    .map((absolute): PageRecord => {
      const raw = fs.readFileSync(absolute, "utf8");
      const { data, content } = matter(raw);
      const rel = path.relative(DOCS_DIR, absolute);
      const base = rel.replace(/\.mdx?$/, "");
      const segments = base.split(path.sep).filter(Boolean);
      const slug =
        segments.at(-1) === "index" ? segments.slice(0, -1) : segments;
      const stat = fs.statSync(absolute);
      return {
        slug,
        url: slug.length ? `/docs/${slug.join("/")}` : "/docs",
        title:
          (data.title as string | undefined) ??
          humanize(segments.at(-1) ?? "docs"),
        description: data.description as string | undefined,
        icon: data.icon as string | undefined,
        filePath: rel.replaceAll("\\", "/"),
        lastModified: stat.mtime.toISOString(),
        content,
      };
    })
    .sort((a, b) => (a.url < b.url ? -1 : a.url > b.url ? 1 : 0));
}

const PAGE_ICONS: Record<string, IconType> = {
  HiSparkles,
  TbApi,
  TbBraces,
  TbCompass,
  TbFileText,
  TbGitFork,
  MdRocketLaunch,
  TbSparkles,
  IoPeople,
};

function pageIcon(name?: string): ReactNode {
  const Icon = name ? PAGE_ICONS[name] : undefined;
  return Icon ? React.createElement(Icon, { className: "size-4" }) : undefined;
}

function buildChildren(prefix: string[], pages: PageRecord[]): PageTreeNode[] {
  const groups = new Map<string, PageRecord[]>();

  for (const page of pages) {
    const first = page.slug[0];
    const bucket = groups.get(first);
    if (bucket) bucket.push(page);
    else groups.set(first, [page]);
  }

  const nodes: PageTreeNode[] = [];

  for (const [name, group] of groups) {
    group.sort((a, b) => ((a.slug[1] ?? "") < (b.slug[1] ?? "") ? -1 : 1));

    const index = group.find((page) => page.slug.length === 1);
    const deepPages = group
      .filter((page) => page.slug.length > 1)
      .map((page) => ({ ...page, slug: page.slug.slice(1) }));
    const icon = pageIcon(index?.icon);

    if (deepPages.length === 0 && index) {
      nodes.push({ type: "page", name: index.title, url: index.url, icon });
      continue;
    }

    const folder: PageTreeFolder = {
      type: "folder",
      name: humanize(name),
      defaultOpen: true,
      collapsible: true,
      icon,
      index: index
        ? { type: "page", name: index.title, url: index.url, icon }
        : undefined,
      children: buildChildren([...prefix, name], deepPages),
    };
    nodes.push(folder);
  }

  return nodes;
}

function buildTree(pages: PageRecord[]): PageTreeRoot {
  const rootItems: PageTreeItem[] = pages
    .filter((page) => page.slug.length === 0)
    .map((page) => ({
      type: "page",
      name: page.title,
      url: page.url,
      icon: pageIcon(page.icon),
    }));

  return {
    type: "root",
    name: "Docs",
    children: [
      ...rootItems,
      ...buildChildren(
        [],
        pages.filter((page) => page.slug.length > 0),
      ),
    ],
  };
}

let cached: {
  pages: DocMeta[];
  tree: PageTreeRoot;
  byUrl: Map<string, PageRecord>;
} | null = null;

function manifest() {
  if (process.env.NODE_ENV === "development") cached = null;
  if (!cached) {
    const pages = loadPages();
    const byUrl = new Map(pages.map((page) => [page.url, page]));
    cached = { pages, tree: buildTree(pages), byUrl };
  }
  return cached;
}

export function getDocManifest() {
  return manifest();
}

export function getDoc(url: string): PageRecord | undefined {
  return manifest().byUrl.get(url);
}

export function editUrl(filePath: string) {
  return `${GITHUB_REPO_URL}/blob/main/site/content/docs/${filePath}`;
}

const mdxComponents = {
  ...defaultMdxComponents,
  Tabs,
  Tab,
  Accordion,
  Accordions,
  Steps,
  Step,
  Files,
  File,
  Folder,
  Heading,
  TypeTable,
};

export async function renderDoc(
  doc: PageRecord,
): Promise<{ body: ComponentType; toc: TOCItemType[] }> {
  const compiled = await compile(doc.content, {
    outputFormat: "function-body",
    providerImportSource: "#",
    remarkPlugins: [
      remarkGfm,
      [remarkNpm, { persist: true }],
      [remarkHeading, { generateToc: true }],
    ],
    rehypePlugins: [rehypeCode],
  });

  const toc = (compiled.data.toc ?? []) as TOCItemType[];

  const mod = (await run(compiled, {
    ...JsxRuntime,
    useMDXComponents: () => mdxComponents,
  })) as unknown as { default: ComponentType };

  return { body: mod.default, toc };
}
