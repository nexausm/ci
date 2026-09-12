"use client";

import { useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import { autocomplete, getAlgoliaResults } from "@algolia/autocomplete-js";
import { createLocalStorageRecentSearchesPlugin } from "@algolia/autocomplete-plugin-recent-searches";
import { liteClient as algoliasearch } from "algoliasearch/lite";
import "@algolia/autocomplete-theme-classic";

interface AlgoliaSearchProps {
  appId: string;
  searchKey: string;
  indexName: string;
}

interface SearchItem extends Record<string, unknown> {
  id?: string;
  label?: string;
  objectID?: string;
  type?: "invoice" | "client" | "product" | "page";
  title?: string;
  subtitle?: string;
  href: string;
  billToName?: string;
  description?: string;
  keywords?: string[];
}

const APP_PAGES: SearchItem[] = [
  {
    label: "Dashboard",
    href: "/dashboard",
    keywords: ["home", "overview", "stats", "invoices"],
  },
  {
    label: "New Invoice",
    href: "/invoices/new",
    keywords: ["create", "make"],
  },
  { label: "Clients", href: "/clients", keywords: ["customers", "people"] },
  { label: "Products", href: "/products", keywords: ["items", "services"] },
  { label: "Company", href: "/company", keywords: ["settings", "profile"] },
];

function filterPages(pages: SearchItem[], query: string): SearchItem[] {
  const q = query.trim().toLowerCase();
  if (!q) {
    return pages;
  }
  return pages.filter(
    (page) =>
      (page.label ?? "").toLowerCase().includes(q) ||
      page.href.toLowerCase().includes(q) ||
      (page.keywords ?? []).some((keyword) =>
        keyword.toLowerCase().includes(q),
      ),
  );
}

export function AlgoliaSearch({
  appId,
  searchKey,
  indexName,
}: AlgoliaSearchProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const instanceRef = useRef<ReturnType<
    typeof autocomplete<SearchItem>
  > | null>(null);
  const pathnameRef = useRef("");
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    pathnameRef.current = pathname;
  }, [pathname]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) {
      return;
    }

    const searchClient = algoliasearch(appId, searchKey);

    const recentSearchesPlugin = createLocalStorageRecentSearchesPlugin({
      key: "topbar",
      limit: 5,
    });

    const instance = autocomplete<SearchItem>({
      container,
      placeholder: "Search invoices, customers, pages\u2026",
      openOnFocus: true,
      detachedMediaQuery: "(min-width: 0px)",
      plugins: [recentSearchesPlugin],
      navigator: {
        navigate({ itemUrl }) {
          if (!itemUrl) {
            return;
          }
          if (itemUrl === pathnameRef.current) {
            instanceRef.current?.setIsOpen(false);
            return;
          }
          router.push(itemUrl);
        },
        navigateNewTab({ itemUrl }) {
          window.open(itemUrl, "_blank", "noopener,noreferrer");
        },
        navigateNewWindow({ itemUrl }) {
          window.open(itemUrl, "_blank", "noopener,noreferrer");
        },
      },
      getSources() {
        return [
          {
            sourceId: "pages",
            getItems({ query }) {
              return filterPages(APP_PAGES, query);
            },
            getItemUrl({ item }) {
              return item.href;
            },
            templates: {
              header({ html }) {
                return html`<span class="aa-SourceHeaderTitle">Pages</span>
                  <div class="aa-SourceHeaderLine"></div>`;
              },
              item({ item, html }) {
                return html`<div class="aa-ItemWrapper">
                  <div class="aa-ItemIcon">
                    <svg
                      aria-hidden="true"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="2"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                    >
                      <polyline points="7 17 17 7"></polyline>
                      <polyline points="7 7 17 7 17 17"></polyline>
                    </svg>
                  </div>
                  <div class="aa-ItemContentBody">
                    <div class="aa-ItemContentTitle">${item.label}</div>
                    <div
                      class="aa-ItemContentSubtitle aa-ItemContentDescription"
                    >
                      ${item.href}
                    </div>
                  </div>
                </div>`;
              },
              noResults({ state, html }) {
                const hasResults = state.collections.some(
                  (collection) => collection.items.length > 0,
                );
                if (hasResults) {
                  return "";
                }
                return html`<div class="aa-NoResults">
                  No results for "${state.query}".
                </div>`;
              },
            },
          },
          {
            sourceId: "invoiceResults",
            getItems({ query: q }) {
              if (!q) {
                return [];
              }
              return getAlgoliaResults<SearchItem>({
                searchClient,
                queries: [
                  {
                    indexName,
                    params: {
                      query: q,
                      filters: "type:invoice",
                      hitsPerPage: 3,
                    },
                  },
                ],
              });
            },
            getItemUrl({ item }) {
              return item.href;
            },
            templates: {
              header({ html }) {
                return html`<span class="aa-SourceHeaderTitle">Invoices</span>
                  <div class="aa-SourceHeaderLine"></div>`;
              },
              item({ item, html, components }) {
                return html`<div class="aa-ItemWrapper">
                  <div class="aa-ItemIcon">
                    <svg
                      aria-hidden="true"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="2"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                    >
                      <path
                        d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"
                      ></path>
                      <polyline points="14 2 14 8 20 8"></polyline>
                    </svg>
                  </div>
                  <div class="aa-ItemContentBody">
                    <div class="aa-ItemContentTitle">
                      ${components.Highlight({
                        hit: item,
                        attribute: "title",
                      })}
                    </div>
                    <div
                      class="aa-ItemContentSubtitle aa-ItemContentDescription"
                    >
                      ${item.billToName ?? ""}
                    </div>
                  </div>
                </div>`;
              },
            },
          },
          {
            sourceId: "clientResults",
            getItems({ query: q }) {
              if (!q) {
                return [];
              }
              return getAlgoliaResults<SearchItem>({
                searchClient,
                queries: [
                  {
                    indexName,
                    params: {
                      query: q,
                      filters: "type:client",
                      hitsPerPage: 3,
                    },
                  },
                ],
              });
            },
            getItemUrl({ item }) {
              return item.href;
            },
            templates: {
              header({ html }) {
                return html`<span class="aa-SourceHeaderTitle">Clients</span>
                  <div class="aa-SourceHeaderLine"></div>`;
              },
              item({ item, html, components }) {
                return html`<div class="aa-ItemWrapper">
                  <div class="aa-ItemIcon">
                    <svg
                      aria-hidden="true"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="2"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                    >
                      <path
                        d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"
                      ></path>
                      <circle cx="12" cy="7" r="4"></circle>
                    </svg>
                  </div>
                  <div class="aa-ItemContentBody">
                    <div class="aa-ItemContentTitle">
                      ${components.Highlight({
                        hit: item,
                        attribute: "title",
                      })}
                    </div>
                    <div
                      class="aa-ItemContentSubtitle aa-ItemContentDescription"
                    >
                      Customer
                    </div>
                  </div>
                </div>`;
              },
            },
          },
          {
            sourceId: "productResults",
            getItems({ query: q }) {
              if (!q) {
                return [];
              }
              return getAlgoliaResults<SearchItem>({
                searchClient,
                queries: [
                  {
                    indexName,
                    params: {
                      query: q,
                      filters: "type:product",
                      hitsPerPage: 3,
                    },
                  },
                ],
              });
            },
            getItemUrl({ item }) {
              return item.href;
            },
            templates: {
              header({ html }) {
                return html`<span class="aa-SourceHeaderTitle">Products</span>
                  <div class="aa-SourceHeaderLine"></div>`;
              },
              item({ item, html, components }) {
                return html`<div class="aa-ItemWrapper">
                  <div class="aa-ItemIcon">
                    <svg
                      aria-hidden="true"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="2"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                    >
                      <path
                        d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"
                      ></path>
                      <polyline
                        points="3.27 6.96 12 12.01 20.73 6.96"
                      ></polyline>
                      <line x1="12" x2="12" y1="22.08" y2="12"></line>
                    </svg>
                  </div>
                  <div class="aa-ItemContentBody">
                    <div class="aa-ItemContentTitle">
                      ${components.Highlight({
                        hit: item,
                        attribute: "title",
                      })}
                    </div>
                    <div
                      class="aa-ItemContentSubtitle aa-ItemContentDescription"
                    >
                      Product
                    </div>
                  </div>
                </div>`;
              },
            },
          },
          {
            sourceId: "brand",
            getItems() {
              return [];
            },
            templates: {
              item() {
                return "";
              },
              noResults() {
                return "";
              },
              footer({ html }) {
                return html`<a
                  class="aa-PoweredBy"
                  href="https://www.algolia.com/?utm_source=autocomplete&utm_medium=feedback&utm_campaign=poweredby"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <span>Powered by</span>
                  <img
                    class="aa-PoweredByLogo"
                    src="/images/logo/Algolia-logo-blue.png"
                    alt="Algolia"
                  />
                </a>`;
              },
            },
          },
        ];
      },
    });

    instanceRef.current = instance;

    return () => {
      instance.destroy();
      instanceRef.current = null;
    };
  }, [appId, searchKey, indexName, router]);

  useEffect(() => {
    instanceRef.current?.setIsOpen(false);
  }, [pathname]);

  return <div ref={containerRef} className="paper-search" />;
}
