import type { NextConfig } from "next";

// `outputFileTracingIncludes` copies exactly the globs listed here — it does
// not retrace the dependencies of files it copies in. `@sparticuz/chromium-min`
// and `playwright-core` are loaded through an opaque dynamic import (see
// lib/pdf.ts) that automatic tracing can't follow, so their full transitive
// `dependencies` closure (per package.json, computed with `npm ls`) has to
// be listed explicitly. `chromium-min` (unlike `@sparticuz/chromium`) does
// not ship the Chromium binary itself — that's fetched at runtime from a
// pinned URL — so this stays a few hundred KB instead of ~80MB.
//
// `playwright-core` and the `bare-*` packages are scoped to exactly what
// `chromium.launch()` / `page.pdf()` touch on Linux, rather than a blanket
// `**/*`: playwright-core's `lib/vite/**` (trace-viewer/recorder/dashboard
// web UI, ~3.6MB) and `types/**` (`.d.ts` declarations, ~1.9MB — never
// loaded at runtime) are dropped, and the `bare-*` packages' prebuilt native
// binaries are narrowed to `linux-*` (Netlify functions only ever run
// linux-x64; the win32/darwin/ios/android prebuilds, ~2.8MB combined, are
// unreachable). A blanket `**/*` here was inflating the deployed function
// past Netlify's 50MB per-function limit. `outputFileTracingExcludes` would
// be the more direct way to trim this, but as of Next 16 it's a no-op under
// Turbopack production builds.
const PLAYWRIGHT_CORE_INCLUDES = [
  "./node_modules/playwright-core/package.json",
  "./node_modules/playwright-core/browsers.json",
  "./node_modules/playwright-core/index.js",
  "./node_modules/playwright-core/index.mjs",
  "./node_modules/playwright-core/lib/bootstrap.js",
  "./node_modules/playwright-core/lib/coreBundle.js",
  "./node_modules/playwright-core/lib/utilsBundle.js",
  "./node_modules/playwright-core/lib/serverRegistry.js",
  "./node_modules/playwright-core/lib/package.js",
  "./node_modules/playwright-core/lib/webp_codec.wasm",
  "./node_modules/playwright-core/lib/xdg-open/**/*",
  "./node_modules/playwright-core/lib/server/**/*",
  "./node_modules/playwright-core/lib/tools/**/*",
  "./node_modules/playwright-core/lib/entry/**/*",
];

const bareLinuxIncludes = (pkg: string) => [
  `./node_modules/${pkg}/package.json`,
  `./node_modules/${pkg}/index.js`,
  `./node_modules/${pkg}/binding.js`,
  `./node_modules/${pkg}/lib/**/*`,
  `./node_modules/${pkg}/prebuilds/linux-*/**/*`,
];

const PDF_ROUTE_INCLUDES = [
  ...PLAYWRIGHT_CORE_INCLUDES,
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
  ...bareLinuxIncludes("bare-fs"),
  ...bareLinuxIncludes("bare-path"),
  "./node_modules/bare-events/**/*",
  "./node_modules/bare-stream/**/*",
  ...bareLinuxIncludes("bare-url"),
  "./node_modules/teex/**/*",
];

const nextConfig: NextConfig = {
  // `pg-cloudflare` ships a `workerd`-specific build (real Cloudflare socket).
  // Listing it here makes the Cloudflare adapter copy the full package using
  // the `workerd` export conditions instead of the default (no-op) build.
  serverExternalPackages: ["pg-cloudflare"],
  outputFileTracingIncludes: {
    "/api/invoices/[id]/pdf": PDF_ROUTE_INCLUDES,
    "/api/invoices/pdf": PDF_ROUTE_INCLUDES,
  },
};

export default nextConfig;
