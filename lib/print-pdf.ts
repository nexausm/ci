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
import type { CompanyInfo, InvoiceData } from "@/lib/types";
import type { PrintSettings } from "@/lib/print-settings";
import {
  invoiceHeaderChrome,
  invoiceFooterChrome,
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

// Each callback's returned HTML needs its own @font-face block — taepdf parses/registers header/footer fonts independently from the main template.
export function buildPrintExtras(
  settings: PrintSettings,
  data: InvoiceData,
  company: CompanyInfo,
): RenderExtras {
  const headerHtml = `${fontFaceStyleTag()}${invoiceHeaderChrome(data, company)}`;
  const footerHtml = `${fontFaceStyleTag()}${invoiceFooterChrome()}`;
  return {
    // With headerMode "every" the full chrome repeats on every page. With
    // "first" the header content lives in the page-1 flow (see invoiceMarkup),
    // so the band only needs to repeat the blue top bar plus the blank top
    // margin — reserving a full header-height band on every page is exactly
    // what leaves a header-sized blank band on pages 2+.
    header: () =>
      settings.headerMode === "every"
        ? headerHtml
        : `${fontFaceStyleTag()}${invoiceTopBar()}<div style="height:${PAGE_MARGIN.top}px"></div>`,
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
