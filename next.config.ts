import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // `pg-cloudflare` ships a `workerd`-specific build (real Cloudflare socket).
  // Listing it here makes the Cloudflare adapter copy the full package using
  // the `workerd` export conditions instead of the default (no-op) build.
  serverExternalPackages: ["pg-cloudflare"],
  // `outputFileTracingIncludes` copies exactly the globs listed here — it does
  // not retrace the dependencies of files it copies in. `@sparticuz/chromium`
  // and `playwright-core` are loaded through an opaque dynamic import (see
  // lib/pdf.ts) that automatic tracing can't follow, so their full transitive
  // `dependencies` closure (per package.json, computed with `npm ls`) has to
  // be listed explicitly.
  outputFileTracingIncludes: {
    "/api/invoices/[id]/pdf": [
      "./node_modules/playwright-core/**/*",
      "./node_modules/@sparticuz/**/*",
      "./node_modules/follow-redirects/**/*",
      "./node_modules/tar-fs/**/*",
      "./node_modules/tar-stream/**/*",
      "./node_modules/pump/**/*",
      "./node_modules/end-of-stream/**/*",
      "./node_modules/once/**/*",
      "./node_modules/wrappy/**/*",
      "./node_modules/fast-fifo/**/*",
      "./node_modules/streamx/**/*",
      "./node_modules/b4a/**/*",
      "./node_modules/events-universal/**/*",
      "./node_modules/text-decoder/**/*",
      "./node_modules/bare-fs/**/*",
      "./node_modules/bare-path/**/*",
      "./node_modules/bare-events/**/*",
      "./node_modules/bare-stream/**/*",
      "./node_modules/bare-url/**/*",
      "./node_modules/teex/**/*",
    ],
    "/api/invoices/pdf": [
      "./node_modules/playwright-core/**/*",
      "./node_modules/@sparticuz/**/*",
      "./node_modules/follow-redirects/**/*",
      "./node_modules/tar-fs/**/*",
      "./node_modules/tar-stream/**/*",
      "./node_modules/pump/**/*",
      "./node_modules/end-of-stream/**/*",
      "./node_modules/once/**/*",
      "./node_modules/wrappy/**/*",
      "./node_modules/fast-fifo/**/*",
      "./node_modules/streamx/**/*",
      "./node_modules/b4a/**/*",
      "./node_modules/events-universal/**/*",
      "./node_modules/text-decoder/**/*",
      "./node_modules/bare-fs/**/*",
      "./node_modules/bare-path/**/*",
      "./node_modules/bare-events/**/*",
      "./node_modules/bare-stream/**/*",
      "./node_modules/bare-url/**/*",
      "./node_modules/teex/**/*",
    ],
  },
};

export default nextConfig;
