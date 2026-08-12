"use strict";

const zlib = require("node:zlib");

// The Prisma query-compiler WASM is imported as `import("....wasm?module")`,
// which Prisma expects to yield a compiled `WebAssembly.Module`.
//
// For the Node server target, webpack's async-WASM emission lands in a
// directory the generated runtime never reads from, so we instead inline the
// WASM inside the bundle. Raw WASM gzips to ~1/3 of its size, so the loader
// ships it gzip-compressed in a base64 string and decompresses at import
// time. This keeps the bundle pure JS (no asset file, no path mismatch, works
// inside OpenNext's esbuild pass) while staying under Cloudflare's 3 MiB
// free-tier gzip limit for Worker scripts.
//
// The generated Cloudflare client reads the module via
// `const { default: module } = await import("....wasm?module")`, so this
// loader sets `module.exports` to the `WebAssembly.Module` instance.
module.exports = function (source) {
  const compressed = zlib.gzipSync(source).toString("base64");
  return [
    '"use strict";',
    'const { gunzipSync } = require("node:zlib");',
    `const bytes = gunzipSync(Buffer.from(${JSON.stringify(compressed)}, "base64"));`,
    "module.exports = new WebAssembly.Module(bytes);",
  ].join("\n");
};

module.exports.raw = true;
