"use client";

import { useCallback, useEffect, useState } from "react";
import type { Client, InvoiceData } from "./types";

async function apiFetch<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: init?.body ? { "Content-Type": "application/json" } : undefined,
  });
  if (!res.ok) throw new Error(`Request to ${url} failed: ${res.status}`);
  return res.json();
}

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

  const upsertClient = useCallback((client: Client) => {
    setClients((prev) => {
      const exists = prev.some((c) => c.id === client.id);
      return exists
        ? prev.map((c) => (c.id === client.id ? client : c))
        : [...prev, client];
    });
    void apiFetch("/api/clients", {
      method: "POST",
      body: JSON.stringify(client),
    });
  }, []);

  const removeClient = useCallback((id: string) => {
    setClients((prev) => prev.filter((c) => c.id !== id));
    void apiFetch(`/api/clients/${id}`, { method: "DELETE" });
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

  const upsertInvoice = useCallback((invoice: InvoiceData) => {
    setInvoices((prev) => {
      const exists = prev.some((i) => i.id === invoice.id);
      return exists
        ? prev.map((i) => (i.id === invoice.id ? invoice : i))
        : [...prev, invoice];
    });
    void apiFetch("/api/invoices", {
      method: "POST",
      body: JSON.stringify(invoice),
    });
  }, []);

  const removeInvoice = useCallback((id: string) => {
    setInvoices((prev) => prev.filter((i) => i.id !== id));
    void apiFetch(`/api/invoices/${id}`, { method: "DELETE" });
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
