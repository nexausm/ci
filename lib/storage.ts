"use client";

import { useCallback, useEffect, useState } from "react";
import type { Client, InvoiceData, Payment } from "./types";

async function apiFetch<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: init?.body ? { "Content-Type": "application/json" } : undefined,
  });
  if (!res.ok) throw new Error(`Request to ${url} failed: ${res.status}`);
  return res.json();
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

// --- hooks ---

export function useClients() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    apiFetch<Client[]>("/api/clients").then((data) => {
      if (cancelled) return;
      setClients(data);
      setLoaded(true);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const upsertClient = useCallback(
    async (client: Client) => {
      const exists = clients.some((c) => c.id === client.id);
      const saved = exists
        ? await updateClient(client.id, client)
        : await createClient(client);
      setClients((prev) => {
        const found = prev.some((c) => c.id === saved.id);
        return found
          ? prev.map((c) => (c.id === saved.id ? saved : c))
          : [...prev, saved];
      });
      return saved;
    },
    [clients],
  );

  const removeClient = useCallback(async (id: string) => {
    await deleteClient(id);
    setClients((prev) => prev.filter((c) => c.id !== id));
  }, []);

  return { clients, loaded, upsertClient, removeClient };
}

export function useInvoices() {
  const [invoices, setInvoices] = useState<InvoiceData[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    apiFetch<InvoiceData[]>("/api/invoices").then((data) => {
      if (cancelled) return;
      setInvoices(data);
      setLoaded(true);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const upsertInvoice = useCallback(
    async (invoice: InvoiceData) => {
      const prev = invoices.find((i) => i.id === invoice.id);
      if (prev) {
        const { id, payments = [], ...patch } = invoice;
        const saved = await updateInvoice(id, patch);
        const prevIds = new Set((prev.payments ?? []).map((p) => p.id));
        const nextIds = new Set(payments.map((p) => p.id));
        for (const p of payments) {
          const body = { ...p, invoiceId: id };
          if (prevIds.has(p.id)) {
            await updatePayment(p.id, body);
          } else {
            await createPayment(body);
          }
        }
        for (const p of prev.payments ?? []) {
          if (!nextIds.has(p.id)) {
            await deletePayment(p.id);
          }
        }
        const refreshed: InvoiceData = { ...saved, payments };
        setInvoices((list) =>
          list.map((i) => (i.id === refreshed.id ? refreshed : i)),
        );
        return refreshed;
      }
      const saved = await createInvoice(invoice);
      setInvoices((list) => {
        const exists = list.some((i) => i.id === saved.id);
        return exists
          ? list.map((i) => (i.id === saved.id ? saved : i))
          : [...list, saved];
      });
      return saved;
    },
    [invoices],
  );

  const removeInvoice = useCallback(async (id: string) => {
    await deleteInvoice(id);
    setInvoices((prev) => prev.filter((i) => i.id !== id));
  }, []);

  return { invoices, loaded, upsertInvoice, removeInvoice };
}

export async function fetchInvoiceById(
  id: string,
): Promise<InvoiceData | null> {
  const res = await fetch(`/api/invoices/${id}`);
  if (!res.ok) return null;
  return res.json();
}
