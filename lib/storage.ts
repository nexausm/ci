"use client";

import { useCallback, useSyncExternalStore } from "react";
import type {
  Client,
  CompanyInfo,
  InvoiceData,
  Payment,
  Product,
} from "./types";

async function apiFetch<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: init?.body ? { "Content-Type": "application/json" } : undefined,
  });
  if (!res.ok) throw new Error(`Request to ${url} failed: ${res.status}`);
  return res.json();
}

// --- company profile ---

export async function updateCompanyProfile(
  profile: CompanyInfo,
): Promise<CompanyInfo> {
  return apiFetch("/api/company", {
    method: "PATCH",
    body: JSON.stringify(profile),
  });
}

// --- clients ---

export async function createClient(client: Client): Promise<Client> {
  return apiFetch("/api/clients", {
    method: "POST",
    body: JSON.stringify(client),
  });
}

export async function updateClient(
  id: string,
  patch: Partial<Client>,
): Promise<Client> {
  return apiFetch(`/api/clients/${id}`, {
    method: "PATCH",
    body: JSON.stringify(patch),
  });
}

export async function deleteClient(id: string): Promise<{ ok: true }> {
  return apiFetch(`/api/clients/${id}`, { method: "DELETE" });
}

// --- invoices ---

export async function createInvoice(
  invoice: InvoiceData,
): Promise<InvoiceData> {
  return apiFetch("/api/invoices", {
    method: "POST",
    body: JSON.stringify(invoice),
  });
}

export async function updateInvoice(
  id: string,
  patch: Partial<InvoiceData>,
): Promise<InvoiceData> {
  return apiFetch(`/api/invoices/${id}`, {
    method: "PATCH",
    body: JSON.stringify(patch),
  });
}

export async function deleteInvoice(id: string): Promise<{ ok: true }> {
  return apiFetch(`/api/invoices/${id}`, { method: "DELETE" });
}

// --- payments ---

export async function createPayment(payment: Payment): Promise<Payment> {
  return apiFetch("/api/payments", {
    method: "POST",
    body: JSON.stringify(payment),
  });
}

export async function updatePayment(
  id: string,
  patch: Partial<Payment>,
): Promise<Payment> {
  return apiFetch(`/api/payments/${id}`, {
    method: "PATCH",
    body: JSON.stringify(patch),
  });
}

export async function deletePayment(id: string): Promise<{ ok: true }> {
  return apiFetch(`/api/payments/${id}`, { method: "DELETE" });
}

// --- products ---

export async function createProduct(product: Product): Promise<Product> {
  return apiFetch("/api/products", {
    method: "POST",
    body: JSON.stringify(product),
  });
}

export async function updateProduct(
  id: string,
  patch: Partial<Product>,
): Promise<Product> {
  return apiFetch(`/api/products/${id}`, {
    method: "PATCH",
    body: JSON.stringify(patch),
  });
}

export async function deleteProduct(id: string): Promise<{ ok: true }> {
  return apiFetch(`/api/products/${id}`, { method: "DELETE" });
}

// --- shared collections ---

type Listener = () => void;

type Collection<T> = {
  subscribe: (listener: Listener) => () => void;
  peek: () => T | undefined;
  patch: (fn: (prev: T) => T) => void;
  failure: () => Error | null;
};

function createCollection<T>(url: string): Collection<T> {
  let data: T | undefined;
  let error: Error | null = null;
  let inFlight: Promise<void> | null = null;
  const listeners = new Set<Listener>();

  const emit = () => listeners.forEach((listener) => listener());

  function load() {
    if (data !== undefined) return Promise.resolve();
    inFlight ??= apiFetch<T>(url)
      .then((value) => {
        data = value;
        error = null;
      })
      .catch((err: Error) => {
        error = err;
      })
      .finally(() => {
        inFlight = null;
        emit();
      });
    return inFlight;
  }

  return {
    subscribe(listener) {
      listeners.add(listener);
      void load();
      return () => {
        listeners.delete(listener);
      };
    },
    peek: () => data,
    patch(fn) {
      if (data !== undefined) {
        data = fn(data);
        emit();
        return;
      }

      void load().then(() => {
        if (data === undefined) return;
        data = fn(data);
        emit();
      });
    },
    failure: () => error,
  };
}

const clientCollection = createCollection<Client[]>("/api/clients");
const invoiceCollection = createCollection<InvoiceData[]>("/api/invoices");
const productCollection = createCollection<Product[]>("/api/products");

const NO_CLIENTS: Client[] = [];
const NO_INVOICES: InvoiceData[] = [];
const NO_PRODUCTS: Product[] = [];

function useCollection<T>(collection: Collection<T>, empty: T) {
  const data = useSyncExternalStore(
    collection.subscribe,
    collection.peek,
    () => undefined,
  );
  return {
    data: data ?? empty,
    loaded: data !== undefined,
    error: collection.failure(),
  };
}

function peekInvoice(id: string): InvoiceData | undefined {
  return invoiceCollection.peek()?.find((inv) => inv.id === id);
}

// --- hooks ---

export function useProducts() {
  const {
    data: products,
    loaded,
    error,
  } = useCollection(productCollection, NO_PRODUCTS);

  const upsertProduct = useCallback(async (product: Product) => {
    const exists = productCollection.peek()?.some((p) => p.id === product.id);
    const saved = exists
      ? await updateProduct(product.id, product)
      : await createProduct(product);
    productCollection.patch((prev) =>
      prev.some((p) => p.id === saved.id)
        ? prev.map((p) => (p.id === saved.id ? saved : p))
        : [...prev, saved],
    );
    return saved;
  }, []);

  const removeProduct = useCallback(async (id: string) => {
    await deleteProduct(id);
    productCollection.patch((prev) => prev.filter((p) => p.id !== id));
  }, []);

  return { products, loaded, error, upsertProduct, removeProduct };
}

export function useClients() {
  const {
    data: clients,
    loaded,
    error,
  } = useCollection(clientCollection, NO_CLIENTS);

  const upsertClient = useCallback(async (client: Client) => {
    const exists = clientCollection.peek()?.some((c) => c.id === client.id);
    const saved = exists
      ? await updateClient(client.id, client)
      : await createClient(client);
    clientCollection.patch((prev) =>
      prev.some((c) => c.id === saved.id)
        ? prev.map((c) => (c.id === saved.id ? saved : c))
        : [...prev, saved],
    );
    return saved;
  }, []);

  const removeClient = useCallback(async (id: string) => {
    await deleteClient(id);
    clientCollection.patch((prev) => prev.filter((c) => c.id !== id));
  }, []);

  return { clients, loaded, error, upsertClient, removeClient };
}

export function useInvoices() {
  const {
    data: invoices,
    loaded,
    error,
  } = useCollection(invoiceCollection, NO_INVOICES);

  const upsertInvoice = useCallback(async (invoice: InvoiceData) => {
    const prev = invoiceCollection.peek()?.find((i) => i.id === invoice.id);
    if (!prev) {
      const created = await createInvoice(invoice);
      invoiceCollection.patch((list) =>
        list.some((i) => i.id === created.id)
          ? list.map((i) => (i.id === created.id ? created : i))
          : [...list, created],
      );
      return created;
    }

    const { id, payments = [], ...patch } = invoice;
    const saved = await updateInvoice(id, patch);
    const prevIds = new Set((prev.payments ?? []).map((p) => p.id));
    const nextIds = new Set(payments.map((p) => p.id));
    for (const p of payments) {
      const body = { ...p, invoiceId: id };
      if (prevIds.has(p.id)) await updatePayment(p.id, body);
      else await createPayment(body);
    }
    for (const p of prev.payments ?? []) {
      if (!nextIds.has(p.id)) await deletePayment(p.id);
    }

    const refreshed: InvoiceData = { ...saved, payments };
    invoiceCollection.patch((list) =>
      list.map((i) => (i.id === refreshed.id ? refreshed : i)),
    );
    return refreshed;
  }, []);

  const removeInvoice = useCallback(async (id: string) => {
    await deleteInvoice(id);
    invoiceCollection.patch((prev) => prev.filter((i) => i.id !== id));
  }, []);

  return { invoices, loaded, error, upsertInvoice, removeInvoice };
}

export async function fetchInvoiceById(
  id: string,
): Promise<InvoiceData | null> {
  const cached = peekInvoice(id);
  if (cached) return cached;
  const res = await fetch(`/api/invoices/${id}`);
  if (!res.ok) return null;
  return res.json();
}
