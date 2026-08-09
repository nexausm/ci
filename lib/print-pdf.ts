"use client";

// Client-side, direct-download PDF generation via taepdf — a Rust/WASM
// HTML-to-PDF engine that captures the exact layout the browser renders
// (getBoundingClientRect/getComputedStyle) and re-emits it as a real,
// selectable-text PDF. No server round-trip, no bundled Chromium, no print
// dialog: the file downloads straight to disk.
//
// taepdf is browser-only, so it is imported lazily inside the handler. The
// @font-face blocks point at the same `/fonts/*` assets the app serves.
// The Bengali/Devanagari Noto fonts are shipped as WOFF2 because taepdf only
// accepts WOFF2/TTF/OTF.

import type { RenderExtras } from "taepdf";
import type { CompanyInfo, Installment, InvoiceData } from "@/lib/types";
import type { PrintSettings } from "@/lib/print-settings";
import type { InvoiceTemplate } from "@/lib/invoice-templates";
import {
  installmentHeaderChrome,
  installmentMarkup,
  invoiceFooterChrome,
  invoiceHeaderChrome,
  invoiceTopBar,
  PAGE_MARGIN,
} from "@/lib/invoice-markup";

const FONT_FACES: {
  family: string;
  weight: string;
  format: string;
  url: string;
}[] = [
  {
    family: "'Inter'",
    weight: "100 900",
    format: "woff2",
    url: "/fonts/InterVariable.woff2",
  },
  {
    family: "'Noto Sans Bengali'",
    weight: "400",
    format: "woff2",
    url: "/fonts/NotoSansBengali-Regular.woff2",
  },
  {
    family: "'Noto Sans Devanagari'",
    weight: "400",
    format: "woff2",
    url: "/fonts/NotoSansDevanagari-Regular.woff2",
  },
];

function fontFaceStyleTag(): string {
  const faces = FONT_FACES.map(
    ({ family, weight, format, url }) =>
      `@font-face{font-family:${family};font-style:normal;font-weight:${weight};font-display:swap;src:url(${url}) format('${format}');}`,
  ).join("\n");
  return `<style>${faces}</style>`;
}

export function buildInvoicePrintHtml(markup: string): string {
  return `${fontFaceStyleTag()}${markup}`;
}

export async function fetchServerNow(): Promise<string> {
  const res = await fetch("/api/time", { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch server time");
  const data = (await res.json()) as { iso?: string };
  return data.iso ?? new Date().toISOString();
}

export function getUserTimeZone(): string {
  if (typeof Intl === "undefined") return "UTC";
  return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
}

// Each callback's returned HTML needs its own @font-face block — taepdf parses/registers header/footer fonts independently from the main template.
export function buildPrintExtras(
  settings: PrintSettings,
  data: InvoiceData,
  company: CompanyInfo,
  printDate?: string,
  timeZone?: string,
  template?: InvoiceTemplate,
  uploadedLogoDataUrl?: string | null,
): RenderExtras {
  const tmpl = template;
  const headerHtml = `${fontFaceStyleTag()}${tmpl ? tmpl.headerChrome(data, company, printDate, timeZone, uploadedLogoDataUrl) : invoiceHeaderChrome(data, company, printDate, timeZone)}`;
  const footerHtml = `${fontFaceStyleTag()}${tmpl ? tmpl.footerChrome() : invoiceFooterChrome()}`;
  const topBarHtml = tmpl ? tmpl.topBar() : invoiceTopBar();
  const pageMargin = tmpl ? tmpl.pageMargin : PAGE_MARGIN;
  return {
    header: () =>
      settings.headerMode === "every"
        ? headerHtml
        : `${fontFaceStyleTag()}${topBarHtml}<div style="height:${pageMargin.top}px"></div>`,
    footer: (page, totalPages) =>
      settings.footerMode === "every" || page === totalPages ? footerHtml : "",
  };
}

export async function downloadInvoicePdf(
  markup: string,
  filename = "invoice.pdf",
  extras?: RenderExtras,
): Promise<void> {
  const { default: pdf } = await import("taepdf");
  await pdf.download(
    buildInvoicePrintHtml(markup),
    "A4",
    pdf.name(filename.replace(/\.pdf$/i, "")),
    undefined,
    extras,
  );
}

export async function downloadInstallmentPdf(
  data: InvoiceData,
  installment: Installment,
  company: CompanyInfo,
  settings: PrintSettings,
  template?: InvoiceTemplate,
): Promise<void> {
  const { default: pdf } = await import("taepdf");
  const tmpl = template;
  const markup = tmpl?.installmentMarkup
    ? tmpl.installmentMarkup(data, installment, {
        headerMode: settings.headerMode,
        company,
      })
    : installmentMarkup(data, installment, {
        headerMode: settings.headerMode,
        company,
      });
  const headerHtml = `${fontFaceStyleTag()}${tmpl?.installmentHeaderChrome ? tmpl.installmentHeaderChrome(data, installment, company) : installmentHeaderChrome(data, installment, company)}`;
  const footerHtml = `${fontFaceStyleTag()}${tmpl ? tmpl.footerChrome() : invoiceFooterChrome()}`;
  const topBarHtml = tmpl ? tmpl.topBar() : invoiceTopBar();
  const pageMargin = tmpl ? tmpl.pageMargin : PAGE_MARGIN;
  const extras: RenderExtras = {
    header: () =>
      settings.headerMode === "every"
        ? headerHtml
        : `${fontFaceStyleTag()}${topBarHtml}<div style="height:${pageMargin.top}px"></div>`,
    footer: (page, totalPages) =>
      settings.footerMode === "every" || page === totalPages ? footerHtml : "",
  };
  await pdf.download(
    buildInvoicePrintHtml(markup),
    "A4",
    pdf.name(
      `${data.invoiceNumber || "invoice"}-installment-${installment.seq + 1}.pdf`,
    ),
    undefined,
    extras,
  );
}
