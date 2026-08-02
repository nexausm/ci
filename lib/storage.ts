"use client";

import { useCallback, useEffect, useState } from "react";
import type { Client, InvoiceData } from "./types";
import { sanitizeClient, sanitizeInvoice } from "./defaults";

export const CLIENTS_KEY = "invoice-app-clients-v1";
export const INVOICES_KEY = "invoice-app-invoices-v1";

function readList<T>(key: string, sanitize: (raw: unknown) => T): T[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.map(sanitize);
  } catch {
    return [];
  }
}

function writeList<T>(key: string, list: T[]) {
  window.localStorage.setItem(key, JSON.stringify(list));
}

export function useClients() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setClients(readList(CLIENTS_KEY, sanitizeClient));
    setLoaded(true);
  }, []);

  const persist = useCallback((next: Client[]) => {
    setClients(next);
    writeList(CLIENTS_KEY, next);
  }, []);

  const upsertClient = useCallback((client: Client) => {
    setClients((prev) => {
      const exists = prev.some((c) => c.id === client.id);
      const next = exists
        ? prev.map((c) => (c.id === client.id ? client : c))
        : [...prev, client];
      writeList(CLIENTS_KEY, next);
      return next;
    });
  }, []);

  const removeClient = useCallback((id: string) => {
    setClients((prev) => {
      const next = prev.filter((c) => c.id !== id);
      writeList(CLIENTS_KEY, next);
      return next;
    });
  }, []);

  return { clients, loaded, upsertClient, removeClient, setClients: persist };
}

export function useInvoices() {
  const [invoices, setInvoices] = useState<InvoiceData[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setInvoices(readList(INVOICES_KEY, sanitizeInvoice));
    setLoaded(true);
  }, []);

  const upsertInvoice = useCallback((invoice: InvoiceData) => {
    setInvoices((prev) => {
      const exists = prev.some((i) => i.id === invoice.id);
      const next = exists
        ? prev.map((i) => (i.id === invoice.id ? invoice : i))
        : [...prev, invoice];
      writeList(INVOICES_KEY, next);
      return next;
    });
  }, []);

  const removeInvoice = useCallback((id: string) => {
    setInvoices((prev) => {
      const next = prev.filter((i) => i.id !== id);
      writeList(INVOICES_KEY, next);
      return next;
    });
  }, []);

  return { invoices, loaded, upsertInvoice, removeInvoice };
}

export function readInvoiceById(id: string): InvoiceData | null {
  const invoices = readList(INVOICES_KEY, sanitizeInvoice);
  return invoices.find((i) => i.id === id) ?? null;
}

export function readClientById(id: string): Client | null {
  const clients = readList(CLIENTS_KEY, sanitizeClient);
  return clients.find((c) => c.id === id) ?? null;
}
