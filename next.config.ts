import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // `pg-cloudflare` ships a `workerd`-specific build (real Cloudflare socket).
  // Listing it here makes the Cloudflare adapter copy the full package using
  // the `workerd` export conditions instead of the default (no-op) build.
  serverExternalPackages: ["pg-cloudflare"],
  outputFileTracingIncludes: {
    "/api/invoices/[id]/pdf": [
      "./node_modules/playwright-core/**/*",
      "./node_modules/@sparticuz/**/*",
    ],
    "/api/invoices/pdf": [
      "./node_modules/playwright-core/**/*",
      "./node_modules/@sparticuz/**/*",
    ],
  },
};

export default nextConfig;
