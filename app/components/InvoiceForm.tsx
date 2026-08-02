"use client";

import { useDeferredValue, useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { pdf } from "@react-pdf/renderer";
import { InvoiceDocument } from "@/app/components/InvoiceDocument";
import {
  createDefaultInvoice,
  newItem,
  sanitizeInvoice,
  STORAGE_KEY,
} from "@/lib/defaults";
import { computeTotals, formatMoney } from "@/lib/totals";
import { CURRENCIES } from "@/lib/currency";
import type { CompanyInfo, CurrencyCode, InvoiceData } from "@/lib/types";

const PDFViewer = dynamic(
  () => import("@react-pdf/renderer").then((m) => m.PDFViewer),
  { ssr: false },
);

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="block text-xs font-medium text-gray-500 mb-1">
        {label}
      </span>
      {children}
    </label>
  );
}

const inputCls =
  "w-full rounded-md border border-gray-300 px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500";

export function InvoiceForm({ company }: { company: CompanyInfo }) {
  const [data, setData] = useState<InvoiceData>(createDefaultInvoice);
  const [loaded, setLoaded] = useState(false);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (raw) setData(sanitizeInvoice(JSON.parse(raw)));
    } catch {}
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (!loaded) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }, [data, loaded]);

  const deferredData = useDeferredValue(data);
  const totals = computeTotals(data);
  const symbol = CURRENCIES[data.currency]?.symbol ?? "$";

  function update(patch: Partial<InvoiceData>) {
    setData((d) => ({ ...d, ...patch }));
  }

  function updateItem(
    id: string,
    patch: Partial<InvoiceData["items"][number]>,
  ) {
    setData((d) => ({
      ...d,
      items: d.items.map((it) => (it.id === id ? { ...it, ...patch } : it)),
    }));
  }

  function addItem() {
    setData((d) => ({ ...d, items: [...d.items, newItem()] }));
  }

  function removeItem(id: string) {
    setData((d) => ({ ...d, items: d.items.filter((it) => it.id !== id) }));
  }

  async function handleDownload() {
    setDownloading(true);
    try {
      const blob = await pdf(
        <InvoiceDocument data={data} company={company} />,
      ).toBlob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Invoice-${data.invoiceNumber || "draft"}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setDownloading(false);
    }
  }

  function resetForm() {
    if (!confirm("Clear all fields and start a new invoice?")) return;
    setData(createDefaultInvoice());
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b bg-white px-6 py-3 flex items-center justify-between sticky top-0 z-10">
        <h1 className="text-base font-semibold text-gray-800">
          Invoice Generator
        </h1>
        <div className="flex gap-2">
          <button
            onClick={resetForm}
            className="text-sm px-3 py-1.5 rounded-md border border-gray-300 text-gray-600 hover:bg-gray-100"
          >
            New invoice
          </button>
          <button
            onClick={handleDownload}
            disabled={downloading}
            className="text-sm px-4 py-1.5 rounded-md bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60"
          >
            {downloading ? "Generating…" : "Download PDF"}
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-0">
        <div className="p-6 space-y-8 max-w-2xl">
          <section className="space-y-2">
            <h2 className="text-sm font-semibold text-gray-700">
              Your business
            </h2>
            <div className="flex items-center gap-3 bg-white border rounded-md p-3">
              {company.logoDataUri ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={company.logoDataUri}
                  alt={company.companyName}
                  className="h-12 w-auto object-contain"
                />
              ) : null}
              <div className="text-sm text-gray-600">
                <div className="font-medium text-gray-800">
                  {company.companyName}
                </div>
                <div>{company.email}</div>
              </div>
            </div>
            <p className="text-xs text-gray-400">
              Edit data/info.json to change your business details or logo.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-sm font-semibold text-gray-700">
              Invoice details
            </h2>
            <div className="grid grid-cols-3 gap-3">
              <Field label="Invoice number">
                <input
                  className={inputCls}
                  value={data.invoiceNumber}
                  onChange={(e) => update({ invoiceNumber: e.target.value })}
                  placeholder="INV-0001"
                />
              </Field>
              <Field label="Date">
                <input
                  type="date"
                  className={inputCls}
                  value={data.invoiceDate}
                  onChange={(e) => update({ invoiceDate: e.target.value })}
                />
              </Field>
              <Field label="Currency">
                <select
                  className={inputCls}
                  value={data.currency}
                  onChange={(e) =>
                    update({ currency: e.target.value as CurrencyCode })
                  }
                >
                  {Object.entries(CURRENCIES).map(([code, info]) => (
                    <option key={code} value={code}>
                      {info.label}
                    </option>
                  ))}
                </select>
              </Field>
            </div>
          </section>

          <section className="space-y-3">
            <h2 className="text-sm font-semibold text-gray-700">Bill to</h2>
            <Field label="Client name">
              <input
                className={inputCls}
                value={data.billToName}
                onChange={(e) => update({ billToName: e.target.value })}
                placeholder="Client Name"
              />
            </Field>
            <Field label="Address (one line per row)">
              <textarea
                className={inputCls}
                rows={2}
                value={data.billToAddress}
                onChange={(e) => update({ billToAddress: e.target.value })}
              />
            </Field>
            <Field label="Phone">
              <input
                className={inputCls}
                value={data.billToPhone}
                onChange={(e) => update({ billToPhone: e.target.value })}
              />
            </Field>
          </section>

          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-gray-700">
                Line items
              </h2>
              <button
                onClick={addItem}
                className="text-xs text-blue-600 hover:underline"
              >
                + Add item
              </button>
            </div>
            <div className="space-y-2">
              {data.items.map((item) => (
                <div
                  key={item.id}
                  className="flex gap-2 items-start bg-white border rounded-md p-2"
                >
                  <input
                    className={inputCls + " flex-1"}
                    placeholder="Description"
                    value={item.description}
                    onChange={(e) =>
                      updateItem(item.id, { description: e.target.value })
                    }
                  />
                  <input
                    type="number"
                    className={inputCls + " w-24"}
                    placeholder="Rate"
                    value={item.rate}
                    onChange={(e) =>
                      updateItem(item.id, { rate: Number(e.target.value) })
                    }
                  />
                  <input
                    type="number"
                    className={inputCls + " w-16"}
                    placeholder="Qty"
                    value={item.qty}
                    onChange={(e) =>
                      updateItem(item.id, { qty: Number(e.target.value) })
                    }
                  />
                  <button
                    onClick={() => removeItem(item.id)}
                    disabled={data.items.length === 1}
                    className="text-red-500 disabled:text-gray-300 text-sm px-1 py-1.5"
                    title="Remove item"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          </section>

          <section className="space-y-3">
            <h2 className="text-sm font-semibold text-gray-700">Adjustments</h2>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="discountEnabled"
                checked={data.discountEnabled}
                onChange={(e) => update({ discountEnabled: e.target.checked })}
              />
              <label htmlFor="discountEnabled" className="text-sm">
                Discount
              </label>
              {data.discountEnabled && (
                <input
                  type="number"
                  aria-label="Discount amount"
                  className={inputCls + " w-32 ml-2"}
                  value={data.discountValue}
                  onChange={(e) =>
                    update({ discountValue: Number(e.target.value) })
                  }
                />
              )}
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="taxEnabled"
                checked={data.taxEnabled}
                onChange={(e) => update({ taxEnabled: e.target.checked })}
              />
              <label htmlFor="taxEnabled" className="text-sm">
                Tax
              </label>
              {data.taxEnabled && (
                <>
                  <input
                    className={inputCls + " w-28 ml-2"}
                    value={data.taxLabel}
                    onChange={(e) => update({ taxLabel: e.target.value })}
                    placeholder="Tax label"
                  />
                  <input
                    type="number"
                    aria-label="Tax amount"
                    className={inputCls + " w-32"}
                    value={data.taxValue}
                    onChange={(e) =>
                      update({ taxValue: Number(e.target.value) })
                    }
                  />
                </>
              )}
            </div>
            <Field label="Amount already paid (optional)">
              <input
                type="number"
                className={inputCls + " w-40"}
                value={data.amountPaid}
                onChange={(e) => update({ amountPaid: Number(e.target.value) })}
              />
            </Field>
          </section>

          <section className="space-y-3">
            <h2 className="text-sm font-semibold text-gray-700">
              Notes (optional)
            </h2>
            <textarea
              className={inputCls}
              rows={3}
              value={data.notes}
              onChange={(e) => update({ notes: e.target.value })}
              placeholder="Payment terms, thank-you note, bank details…"
            />
          </section>

          <div className="text-sm text-gray-600 border-t pt-4">
            Subtotal: {formatMoney(totals.subtotal, symbol)} &nbsp;·&nbsp;
            Total: {formatMoney(totals.total, symbol)} &nbsp;·&nbsp; Balance
            due:{" "}
            <span className="font-semibold">
              {formatMoney(totals.balanceDue, symbol)}
            </span>
          </div>
        </div>

        <div className="bg-gray-200 lg:sticky lg:top-12.25 lg:h-[calc(100vh-49px)]">
          {loaded ? (
            <PDFViewer
              style={{ width: "100%", height: "100%", border: "none" }}
              showToolbar={false}
            >
              <InvoiceDocument data={deferredData} company={company} />
            </PDFViewer>
          ) : null}
        </div>
      </div>
    </div>
  );
}
