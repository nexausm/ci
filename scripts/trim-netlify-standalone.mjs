// Runs after `next build` via the `postbuild` npm lifecycle. Netlify's
// `@netlify/plugin-nextjs` packages its `___netlify-server-handler` function
// by copying `.next/standalone` (Next's traced output) verbatim into the
// function bundle. The per-route `outputFileTracingIncludes` in
// next.config.ts can add files, but nothing can subtract from the shared
// server runtime trace (`.next/next-server.js.nft.json`), and Netlify's
// `[functions] included_files` only *adds* files — its `!` exclusion globs
// are ignored for the handler. So the only lever that works is removing dead
// weight from `.next/standalone` after the build, before the plugin copies it.
//
// The files removed here are all known-dead on Netlify:
//
//   - `@img/**` + `sharp/**` (~17MB): `next/dist/server/image-optimizer.js`
//     loads sharp lazily via `require("sharp")` and only for server-side
//     image optimization, which never runs on Netlify — its image CDN
//     answers `/_next/image` (see the redirects in the UI config) before the
//     request reaches the function, and the app never imports sharp or
//     next/image itself.
//
//   - `next/dist/server/capsize-font-metrics.json` (~4MB): next/font's font
//     metrics lookup table. It is required only by
//     `next/dist/server/font-utils.js`, which nothing in the runtime imports
//     (the app self-hosts fonts via plain CSS, not next/font).

import { readdir, rm, stat } from "node:fs/promises";
import { join } from "node:path";
import { existsSync } from "node:fs";

async function sizeOf(target) {
  const info = await stat(target);
  if (info.isFile()) return info.size;
  let total = 0;
  for (const entry of await readdir(target, { withFileTypes: true })) {
    const child = join(target, entry.name);
    total += entry.isDirectory()
      ? await sizeOf(child)
      : (await stat(child)).size;
  }
  return total;
}

const ROOT = process.cwd();
const STANDALONE_NODE_MODULES = join(
  ROOT,
  ".next",
  "standalone",
  "node_modules",
);

const DEAD = ["@img", "sharp", "next/dist/server/capsize-font-metrics.json"];

const MB = 1024 * 1024;

async function main() {
  if (!existsSync(STANDALONE_NODE_MODULES)) {
    console.log(
      "trim-netlify-standalone: no .next/standalone, skipping (not a standalone build)",
    );
    return;
  }

  let removedBytes = 0;
  for (const rel of DEAD) {
    const target = join(STANDALONE_NODE_MODULES, rel);
    if (!existsSync(target)) continue;
    const size = await sizeOf(target);
    await rm(target, { recursive: true, force: true });
    removedBytes += size;
    console.log(
      `trim-netlify-standalone: removed ${rel} (${(size / MB).toFixed(1)} MiB)`,
    );
  }

  if (removedBytes === 0) {
    console.log("trim-netlify-standalone: nothing to remove");
    return;
  }

  console.log(
    `trim-netlify-standalone: freed ${(removedBytes / MB).toFixed(1)} MiB from .next/standalone`,
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
