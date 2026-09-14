import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  DocsBody,
  DocsPage,
  DocsTitle,
  PageLastUpdate,
} from "fumadocs-ui/layouts/docs/page";
import { CopyMarkdownButton } from "@/components/docs/copy-markdown";
import { ViewOptions } from "@/components/docs/view-options";
import { editUrl, getDoc, getDocManifest, renderDoc } from "@/lib/docs";

interface Props {
  params: Promise<{ slug?: string[] }>;
}

export function generateStaticParams() {
  return [
    { slug: [] },
    ...getDocManifest().pages.map((page) => ({ slug: page.slug })),
  ];
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug = [] } = await params;
  const doc = getDoc(slug.length ? `/docs/${slug.join("/")}` : "/docs");
  return {
    title: doc ? `${doc.title} | Cloud Invoice Docs` : "Cloud Invoice Docs",
    description: doc?.description,
  };
}

export default async function Page({ params }: Props) {
  const { slug = [] } = await params;
  const doc = getDoc(slug.length ? `/docs/${slug.join("/")}` : "/docs");
  if (!doc) notFound();

  const { body: MDX, toc } = await renderDoc(doc);

  return (
    <DocsPage
      toc={toc}
      tableOfContent={{ enabled: toc.length > 0 }}
      tableOfContentPopover={{ enabled: toc.length > 0 }}
      breadcrumb={{ enabled: true }}

      footer={{ enabled: true }}
    >
      <DocsTitle>{doc.title}</DocsTitle>
      {doc.description ? (
        <p className="text-fd-muted-foreground mb-2 text-lg">
          {doc.description}
        </p>
      ) : null}
      <div className="mb-4 flex flex-row flex-wrap items-center gap-2 border-b pb-6">
        <CopyMarkdownButton content={doc.content} />
        <ViewOptions githubUrl={editUrl(doc.filePath)} />
      </div>
      <DocsBody>
        <MDX />
      </DocsBody>
      <PageLastUpdate date={new Date(doc.lastModified)} />
    </DocsPage>
  );
}
