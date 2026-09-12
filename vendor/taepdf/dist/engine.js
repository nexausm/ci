// engine.ts
import initEngine, {
  register_font,
  register_font_raw,
  register_font_ttc,
  get_compressed_range,
  decompress_brotli,
  read_font_meta,
  measure_string_width,
  list_registered_fonts,
} from "./taetype/taetype.js";
var PAGE_A4 = { width: 595.28, height: 841.89 };
var PAGE_A5 = { width: 419.53, height: 595.28 };
var PAGE_LETTER = { width: 612, height: 792 };
var _fetchCache = /* @__PURE__ */ new Map();
var _woff2Cache = /* @__PURE__ */ new Map();
var _wasmReady = null;
var _ensureWasm = () => {
  if (!_wasmReady) _wasmReady = initEngine().then(() => void 0);
  return _wasmReady;
};
function _fetchFont(path) {
  if (!_fetchCache.has(path)) {
    const p = fetch(path).then((r) => {
      if (!r.ok) throw new Error(`Failed to fetch font ${path}: ${r.status}`);
      return r.arrayBuffer().then((b) => new Uint8Array(b));
    });
    p.catch(() => _fetchCache.delete(path));
    _fetchCache.set(path, p);
  }
  return _fetchCache.get(path);
}
function _decompressWoff2(path, bytes) {
  if (!_woff2Cache.has(path)) {
    const p = (async () => {
      const { start, length } = get_compressed_range(bytes);
      const decompressed = decompress_brotli(
        bytes.slice(start, start + length),
      );
      return { bytes, decompressed };
    })();
    p.catch(() => _woff2Cache.delete(path));
    _woff2Cache.set(path, p);
  }
  return _woff2Cache.get(path);
}
function _isRawFont(bytes) {
  if (bytes.length < 4) return false;
  const sig =
    ((bytes[0] << 24) | (bytes[1] << 16) | (bytes[2] << 8) | bytes[3]) >>> 0;
  return sig === 65536 || sig === 1330926671 || sig === 1953658213;
}
async function loadAndRegisterFont(entry) {
  await _ensureWasm();
  const bytes = await _fetchFont(entry.path);
  const sig =
    bytes.length >= 4
      ? ((bytes[0] << 24) | (bytes[1] << 16) | (bytes[2] << 8) | bytes[3]) >>> 0
      : 0;
  if (sig === 1953784678) {
    register_font_ttc(entry.name, bytes, entry.ttcIndex ?? 0);
    return;
  }
  if (_isRawFont(bytes)) {
    register_font_raw(entry.name, bytes);
    return;
  }
  const { bytes: woff2Bytes, decompressed } = await _decompressWoff2(
    entry.path,
    bytes,
  );
  const index = entry.ttcIndex ?? 0;
  const meta = read_font_meta(woff2Bytes, decompressed, index);
  const weight = meta.isVariable ? 0 : meta.weight;
  register_font(
    entry.name,
    meta.style,
    weight,
    0,
    woff2Bytes,
    decompressed,
    index,
  );
}
function triggerDownload(bytes, fileName) {
  const isIOS =
    /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  const blob = new Blob([bytes], {
    type: isIOS ? "application/octet-stream" : "application/pdf",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1e4);
}
var safeName = (s) =>
  s
    .trim()
    .replace(/\s+/g, "_")
    .replace(/[^\p{L}\p{N}\p{M}_-]/gu, "");
export {
  PAGE_A4,
  PAGE_A5,
  PAGE_LETTER,
  initEngine,
  list_registered_fonts,
  loadAndRegisterFont,
  measure_string_width,
  safeName,
  triggerDownload,
};
