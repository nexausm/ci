import { GITHUB_REPO_URL } from "@site/lib/site";

import { IFooter } from "../types";

export const footerData: IFooter[] = [
  {
    title: "Product",
    links: [
      { name: "Features", href: "/#features" },
      { name: "Download", href: "/download" },
      { name: "Releases", href: `${GITHUB_REPO_URL}/releases`, external: true },
    ],
  },
  {
    title: "Community",
    links: [
      { name: "Community", href: "/community" },
      {
        name: "Discussions",
        href: `${GITHUB_REPO_URL}/discussions`,
        external: true,
      },
      { name: "Documentation", href: "/docs" },
    ],
  },
  {
    title: "Project",
    links: [
      { name: "Brand Guide", href: "/docs/brand" },
      {
        name: "Licence",
        href: `${GITHUB_REPO_URL}/blob/main/LICENSE`,
        external: true,
      },
    ],
  },
];
