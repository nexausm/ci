import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // `pg-cloudflare` ships a `workerd`-specific build (real Cloudflare socket).
  // Listing it here makes the Cloudflare adapter copy the full package using
  // the `workerd` export conditions instead of the default (no-op) build.
  serverExternalPackages: ["pg-cloudflare"],
};

export default nextConfig;
