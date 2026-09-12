import { algoliasearch } from "algoliasearch";
import type { Client, Product } from "@/lib/types";

export interface InvoiceIndexSource {
  id: string;
  invoiceNumber: string;
  billToName: string;
}

export interface PageRecord {
  label: string;
  href: string;
  keywords?: string[];
}

export interface SearchHit {
  objectID: string;
  type: "invoice" | "client" | "product" | "page";
  title: string;
  subtitle: string;
  href: string;
  invoiceNumber?: string;
  billToName?: string;
  name?: string;
  description?: string;
  keywords?: string[];
}

export interface SearchResults {
  invoices: SearchHit[];
  clients: SearchHit[];
  products: SearchHit[];
  pages: SearchHit[];
}

export const APP_PAGES: PageRecord[] = [
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

const MISSING_ENV =
  "ALGOLIA_APP_ID, ALGOLIA_ADMIN_API_KEY and ALGOLIA_INDEX_NAME must be set";

const APP_ID = process.env.ALGOLIA_APP_ID;
const ADMIN_API_KEY = process.env.ALGOLIA_ADMIN_API_KEY;
const INDEX_NAME = process.env.ALGOLIA_INDEX_NAME;

function notConfigured(): boolean {
  return !APP_ID || !ADMIN_API_KEY || !INDEX_NAME;
}

function logMissingEnv(): void {
  console.error(`[algolia] not configured: ${MISSING_ENV}`);
}

function getClient() {
  if (notConfigured()) {
    logMissingEnv();
    return null;
  }
  return algoliasearch(APP_ID!, ADMIN_API_KEY!);
}

async function safe(fn: () => Promise<unknown>): Promise<void> {
  try {
    await fn();
  } catch (err) {
    console.error("[algolia] indexing failed:", err);
  }
}

export function invoiceRecord(inv: InvoiceIndexSource): SearchHit {
  return {
    objectID: `invoice_${inv.id}`,
    type: "invoice",
    invoiceNumber: inv.invoiceNumber,
    billToName: inv.billToName,
    title: inv.invoiceNumber || "(no number)",
    subtitle: inv.billToName,
    href: `/invoices/${inv.id}`,
  };
}

export function clientRecord(client: Pick<Client, "id" | "name">): SearchHit {
  return {
    objectID: `client_${client.id}`,
    type: "client",
    name: client.name,
    title: client.name,
    subtitle: "",
    href: "/clients",
  };
}

export function productRecord(product: Product): SearchHit {
  return {
    objectID: `product_${product.id}`,
    type: "product",
    name: product.name,
    description: product.description,
    title: product.name,
    subtitle: product.description,
    href: "/products",
  };
}

export function pageRecord(page: PageRecord): SearchHit {
  return {
    objectID: `page_${page.href}`,
    type: "page",
    title: page.label,
    subtitle: "Go to page",
    href: page.href,
    keywords: page.keywords,
  };
}

export function pageRecords(): SearchHit[] {
  return APP_PAGES.map(pageRecord);
}

export function indexInvoice(inv: InvoiceIndexSource): Promise<void> {
  const client = getClient();
  if (!client) return Promise.resolve();
  return safe(() =>
    client.saveObject({ indexName: INDEX_NAME!, body: invoiceRecord(inv) }),
  );
}

export function unindexInvoice(id: string): Promise<void> {
  const client = getClient();
  if (!client) return Promise.resolve();
  return safe(() =>
    client.deleteObject({ indexName: INDEX_NAME!, objectID: `invoice_${id}` }),
  );
}

export function indexClient(client: Client): Promise<void> {
  const search = getClient();
  if (!search) return Promise.resolve();
  return safe(() =>
    search.saveObject({
      indexName: INDEX_NAME!,
      body: clientRecord(client),
    }),
  );
}

export function unindexClient(id: string): Promise<void> {
  const search = getClient();
  if (!search) return Promise.resolve();
  return safe(() =>
    search.deleteObject({ indexName: INDEX_NAME!, objectID: `client_${id}` }),
  );
}

export function indexProduct(product: Product): Promise<void> {
  const search = getClient();
  if (!search) return Promise.resolve();
  return safe(() =>
    search.saveObject({
      indexName: INDEX_NAME!,
      body: productRecord(product),
    }),
  );
}

export function unindexProduct(id: string): Promise<void> {
  const search = getClient();
  if (!search) return Promise.resolve();
  return safe(() =>
    search.deleteObject({ indexName: INDEX_NAME!, objectID: `product_${id}` }),
  );
}

export function replaceAll(records: SearchHit[]): Promise<number> {
  const search = getClient();
  if (!search) return Promise.resolve(0);
  let count = 0;
  return safe(async () => {
    await search.replaceAllObjects({
      indexName: INDEX_NAME!,
      objects: records as unknown as Record<string, unknown>[],
    });
    count = records.length;
  }).then(() => count);
}

export async function configureIndex(): Promise<void> {
  const search = getClient();
  if (!search) return;
  await safe(() =>
    search.setSettings({
      indexName: INDEX_NAME!,
      indexSettings: {
        searchableAttributes: [
          "title",
          "subtitle",
          "keywords",
          "invoiceNumber",
          "billToName",
          "name",
          "description",
        ],
        attributesForFaceting: ["type"],
        attributesToRetrieve: [
          "objectID",
          "type",
          "title",
          "subtitle",
          "href",
          "invoiceNumber",
          "billToName",
          "name",
          "description",
        ],
      },
    }),
  );
}

export async function searchRecords(
  q: string,
  hitsPerPage = 5,
): Promise<SearchResults> {
  const search = getClient();
  const EMPTY: SearchResults = {
    invoices: [],
    clients: [],
    products: [],
    pages: [],
  };
  if (!search) return EMPTY;
  const client = search;

  async function searchGroup<T>(type: string): Promise<T[]> {
    try {
      const res = await client.searchSingleIndex<T>({
        indexName: INDEX_NAME!,
        searchParams: { query: q, filters: `type:${type}`, hitsPerPage },
      });
      return res.hits;
    } catch (err) {
      if (err instanceof Error && err.message.includes("does not exist")) {
        console.warn(
          `[algolia] index "${INDEX_NAME}" not found yet; returning empty results`,
        );
        return [];
      }
      throw err;
    }
  }

  const [invoices, clients, products, pages] = await Promise.all([
    searchGroup<SearchHit>("invoice"),
    searchGroup<SearchHit>("client"),
    searchGroup<SearchHit>("product"),
    searchGroup<SearchHit>("page"),
  ]);
  return {
    invoices,
    clients,
    products,
    pages,
  };
}
