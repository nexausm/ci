// Single entry point for the app's Prisma client.
//
// The `nodejs` runtime client (generated/prisma-node) works on Node (Vercel,
// Netlify) and inlines its query-compiler WASM as base64 — no `.wasm` asset.
// The `cloudflare` runtime client (generated/prisma) is required on Cloudflare
// workers. `next.config.ts` swaps this module for the Cloudflare client at
// build time when `CF_PAGES=1`; the two expose identical types.
export { PrismaClient, Prisma } from "@/generated/prisma-node/client";
