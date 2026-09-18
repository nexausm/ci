import { DocsLayout } from "fumadocs-ui/layouts/docs";
import { getDocManifest } from "@site/lib/docs";
import { GITHUB_REPO_URL } from "@site/lib/site";
import { Logo } from "@site/components/landing/logo";

export default function DocsPageLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const { tree } = getDocManifest();

  return (
    <DocsLayout
      tree={tree}
      githubUrl={GITHUB_REPO_URL}
      nav={{
        enabled: true,
        title: <Logo />,
        url: "/",
        transparentMode: "top",
      }}
      links={[
        {
          type: "main",
          text: "Home",
          url: "/",
          active: "nested-url",
        },
        {
          type: "main",
          text: "Features",
          url: "/features",
          active: "nested-url",
        },
        {
          type: "main",
          text: "Download",
          url: "/download",
          active: "nested-url",
        },
        {
          type: "main",
          text: "Community",
          url: "/community",
          active: "nested-url",
        },
      ]}
      themeSwitch={{ enabled: true }}
    >
      {children}
    </DocsLayout>
  );
}
