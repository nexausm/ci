"use client";

// Client-side PDF generation via the browser's own print engine. The invoice
// markup is written into a same-origin, off-screen iframe carrying its own
// `@page` rules and @font-face declarations, then `window.print()` runs inside
// that iframe. The browser lays the document out at A4 size and produces a
// real, selectable-text PDF with correct script shaping (Bengali/Devanagari
// included) — no server round-trip and no bundled Chromium.
//
// The font URLs are the same `/fonts/*` assets the app already serves, so the
// fonts are fetched once and cached by the browser.

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
    format: "woff",
    url: "/fonts/NotoSansBengali-Regular.woff",
  },
  {
    family: "'Noto Sans Devanagari'",
    weight: "400",
    format: "woff",
    url: "/fonts/NotoSansDevanagari-Regular.woff",
  },
];

export function buildInvoicePrintHtml(markup: string): string {
  const faces = FONT_FACES.map(
    ({ family, weight, format, url }) =>
      `@font-face{font-family:${family};font-style:normal;font-weight:${weight};font-display:swap;src:url(${url}) format('${format}');}`,
  ).join("\n");

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8"/>
<title>Invoice</title>
<style>
* { margin: 0; padding: 0; box-sizing: border-box; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
html, body { background: #ffffff; }
@page { size: A4; margin: 0; }
${faces}
</style>
</head>
<body>${markup}</body>
</html>`;
}

async function waitForFonts(doc: Document): Promise<void> {
  const fonts = doc.fonts;
  if (!fonts || typeof fonts.ready?.then !== "function") return;
  await Promise.race([
    fonts.ready,
    new Promise<void>((resolve) => setTimeout(resolve, 4000)),
  ]);
}

export async function printInvoice(markup: string): Promise<void> {
  const iframe = document.createElement("iframe");
  iframe.setAttribute("aria-hidden", "true");
  iframe.style.position = "fixed";
  iframe.style.right = "0";
  iframe.style.bottom = "0";
  iframe.style.width = "0";
  iframe.style.height = "0";
  iframe.style.border = "0";
  document.body.appendChild(iframe);

  const win = iframe.contentWindow;
  if (!win) {
    iframe.remove();
    throw new Error("Print iframe unavailable");
  }

  const doc = win.document;
  doc.open();
  doc.write(buildInvoicePrintHtml(markup));
  doc.close();

  await waitForFonts(doc);

  win.focus();
  win.print();

  setTimeout(() => iframe.remove(), 2000);
}
