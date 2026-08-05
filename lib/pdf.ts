import { FONT_DATA_URIS } from "@/generated/assets";
import type { Browser } from "playwright-core";

// These packages are loaded through base64-decoded specifiers (computed at
// runtime, never literal strings) so that neither the Next.js (Turbopack)
// build nor the Cloudflare Workers esbuild bundle can statically resolve and
// bundle them. The Chromium path is never executed on Cloudflare (the Browser
// Run API is used there instead), so keeping Playwright and the Chromium
// binary out of the worker bundle is required to stay within the Worker size
// limit. On Node platforms (Vercel/Netlify) the packages are traced into the
// deployment via `outputFileTracingIncludes` in next.config.ts and loaded from
// node_modules at runtime.
const CHROMIUM_PACKAGE = atob("QHNwYXJ0aWN1ei9jaHJvbWl1bQ==");
const PLAYWRIGHT_CORE_PACKAGE = atob("cGxheXdyaWdodC1jb3Jl");
const PLAYWRIGHT_PACKAGE = atob("cGxheXdyaWdodA==");

const FONT_FILES: {
  name: string;
  family: string;
  weight: string;
  format: string;
}[] = [
  {
    name: "InterVariable.woff2",
    family: "'Inter'",
    weight: "100 900",
    format: "woff2",
  },
  {
    name: "NotoSansBengali-Regular.woff",
    family: "'Noto Sans Bengali'",
    weight: "400",
    format: "woff",
  },
  {
    name: "NotoSansDevanagari-Regular.woff",
    family: "'Noto Sans Devanagari'",
    weight: "400",
    format: "woff",
  },
];

function isCloudflare(): boolean {
  return process.env.CF_PAGES === "1";
}

function buildHtml(markup: string): string {
  const faces = FONT_FILES.map(({ name, family, weight, format }) => {
    const uri = FONT_DATA_URIS[name];
    if (!uri) throw new Error(`Missing generated font data URI for ${name}`);
    return `@font-face{font-family:${family};font-style:normal;font-weight:${weight};font-display:swap;src:url(${uri}) format('${format}');}`;
  }).join("\n");

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8"/>
<title>Invoice</title>
<style>
html, body { margin: 0; padding: 0; background: #ffffff; }
@page { size: A4; margin: 0; }
${faces}
</style>
</head>
<body>${markup}</body>
</html>`;
}

async function renderViaBrowserRun(html: string): Promise<Buffer> {
  const accountId = process.env.CF_BROWSER_ACCOUNT_ID;
  const apiToken = process.env.CF_BROWSER_API_TOKEN;
  if (!accountId || !apiToken) {
    throw new Error(
      "Cloudflare PDF path requires CF_BROWSER_ACCOUNT_ID and CF_BROWSER_API_TOKEN",
    );
  }
  const res = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${accountId}/browser-rendering/pdf`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        html,
        pdfOptions: {
          format: "A4",
          printBackground: true,
          margin: { top: 0, right: 0, bottom: 0, left: 0 },
        },
      }),
    },
  );
  if (!res.ok) {
    const detail = (await res.text().catch(() => "")).slice(0, 300);
    throw new Error(`Browser Run /pdf failed (${res.status}): ${detail}`);
  }
  return Buffer.from(await res.arrayBuffer());
}

let browserPromise: Promise<Browser> | null = null;

// Built at runtime via `new Function` so the specifier lives inside an opaque
// string, not analyzable import syntax. This keeps Turbopack (`next dev`),
// webpack (`next build`), and Cloudflare's esbuild from statically resolving
// and bundling chromium/playwright-core — while still using native dynamic
// `import()` resolution at actual execution time.
const dynamicImport = new Function("specifier", "return import(specifier)") as (
  specifier: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- module shape is opaque by design
) => Promise<any>;

async function launchChromium() {
  if (process.env.NODE_ENV === "production") {
    const [sparticuz, core] = await Promise.all([
      dynamicImport(CHROMIUM_PACKAGE),
      dynamicImport(PLAYWRIGHT_CORE_PACKAGE),
    ]);
    return core.chromium.launch({
      args: sparticuz.default.args,
      executablePath: await sparticuz.default.executablePath(),
      headless: true,
    });
  }
  const { chromium } = await dynamicImport(PLAYWRIGHT_PACKAGE);
  return chromium.launch({
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });
}

function getBrowser(): Promise<Browser> {
  browserPromise ??= launchChromium();
  return browserPromise;
}

async function renderViaChromium(html: string): Promise<Buffer> {
  const browser = await getBrowser();
  const page = await browser.newPage();
  try {
    await page.setContent(html, { waitUntil: "load" });
    await page.evaluate(() => document.fonts.ready);
    const buffer = await page.pdf({
      preferCSSPageSize: true,
      printBackground: true,
      margin: { top: 0, right: 0, bottom: 0, left: 0 },
    });
    return Buffer.from(buffer);
  } finally {
    await page.close();
  }
}

export async function renderInvoicePdf(markup: string): Promise<Buffer> {
  const html = buildHtml(markup);
  if (isCloudflare()) {
    return renderViaBrowserRun(html);
  }
  return renderViaChromium(html);
}
