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

export function buildInvoicePrintHtml(markup: string): string {
  const faces = FONT_FACES.map(
    ({ family, weight, format, url }) =>
      `@font-face{font-family:${family};font-style:normal;font-weight:${weight};font-display:swap;src:url(${url}) format('${format}');}`,
  ).join("\n");

  return `<style>${faces}</style>${markup}`;
}

export async function downloadInvoicePdf(
  markup: string,
  filename = "invoice.pdf",
): Promise<void> {
  const { default: pdf } = await import("taepdf");
  await pdf.download(
    buildInvoicePrintHtml(markup),
    "A4",
    pdf.name(filename.replace(/\.pdf$/i, "")),
  );
}
