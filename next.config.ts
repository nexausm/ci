import path from "node:path";
import type { NextConfig } from "next";

// The app needs two Prisma clients: the `nodejs` runtime (Vercel, Netlify,
// self-hosted) and the `cloudflare` runtime (Workers). The build picks one via
// this flag; it is set for every `cf:*` command in package.json. On Cloudflare
// Pages it is also set at runtime, which the app reads directly.
const isCf = process.env.CF_PAGES === "1";

const nextConfig: NextConfig = {
  // `pg-cloudflare` ships a `workerd`-specific build (real Cloudflare socket).
  // Listing it here makes the Cloudflare adapter copy the full package using
  // the `workerd` export conditions instead of the default (no-op) build.
  serverExternalPackages: ["pg-cloudflare"],
  webpack(config, { isServer, webpack }) {
    if (isCf) {
      // The Cloudflare runtime client imports its query compiler via
      // `import("....wasm?module")`. webpack's async-WASM emission lands in a
      // directory the generated runtime never reads from, so instead we inline
      // the WASM. Raw WASM gzips ~3x, so we ship it gzip-compressed inside a
      // base64 string and decompress at import time; this keeps the Worker
      // under Cloudflare's 3 MiB free-tier gzip limit (see
      // tools/prisma-wasm-inline-loader.cjs).
      if (isServer) {
        config.module.rules.push({
          test: /\.wasm$/,
          type: "javascript/auto",
          use: path.join(process.cwd(), "tools/prisma-wasm-inline-loader.cjs"),
        });
      }
      // Use the Cloudflare-runtime client on Cloudflare builds; elsewhere the
      // default `lib/prisma-client.ts` (nodejs runtime) is used. Both expose
      // identical types. This must be a module-level replacement, not a
      // `resolve.alias`: Next's tsconfig `@/*` resolver wins over aliases.
      config.plugins.push(
        new webpack.NormalModuleReplacementPlugin(
          /^@\/lib\/prisma-client$/,
          path.join(process.cwd(), "generated/prisma/client"),
        ),
      );
    }
    return config;
  },
};

export default nextConfig;
