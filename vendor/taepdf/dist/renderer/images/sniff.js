// renderer/images/sniff.ts
import { forEachChunk } from "./pngchunks.js";
function sniffFormat(b) {
  if (b.length >= 2 && b[0] === 255 && b[1] === 216) return "jpeg";
  if (
    b.length >= 8 &&
    b[0] === 137 &&
    b[1] === 80 &&
    b[2] === 78 &&
    b[3] === 71
  )
    return "png";
  if (
    b.length >= 4 &&
    ((b[0] === 73 && b[1] === 73 && b[2] === 42 && b[3] === 0) ||
      (b[0] === 77 && b[1] === 77 && b[2] === 0 && b[3] === 42))
  )
    return "tiff";
  if (b.length >= 4 && b[0] === 71 && b[1] === 73 && b[2] === 70 && b[3] === 56)
    return "gif";
  if (b.length >= 2 && b[0] === 66 && b[1] === 77) return "bmp";
  if (b.length >= 4 && b[0] === 0 && b[1] === 0 && b[2] === 1 && b[3] === 0)
    return "ico";
  const tag = (o) =>
    o + 4 <= b.length
      ? String.fromCharCode(b[o], b[o + 1], b[o + 2], b[o + 3])
      : "";
  if (b.length >= 12 && tag(0) === "RIFF" && tag(8) === "WEBP") return "webp";
  if (b.length >= 12 && tag(4) === "ftyp") {
    if (tag(8) === "avif" || tag(8) === "avis") return "avif";
    const boxSize =
      b.length >= 4
        ? ((b[0] << 24) | (b[1] << 16) | (b[2] << 8) | b[3]) >>> 0
        : 0;
    const end = boxSize > 0 ? Math.min(boxSize, b.length) : b.length;
    for (let o = 16; o + 4 <= end; o += 4) {
      if (tag(o) === "avif" || tag(o) === "avis") return "avif";
    }
  }
  return "unknown";
}
function pngNeedsBrowserDecode(b) {
  if (b.length < 33) return false;
  if (b[12] !== 73 || b[13] !== 72 || b[14] !== 68 || b[15] !== 82)
    return false;
  const bpc = b[24],
    ct = b[25],
    interlace = b[28];
  if (interlace !== 0 || bpc !== 8) return true;
  if (ct !== 0 && ct !== 2 && ct !== 4 && ct !== 6) return true;
  return hasTrnsChunk(b);
}
function hasTrnsChunk(b) {
  let found = false;
  forEachChunk(b, (type) => {
    if (type === "tRNS") {
      found = true;
      return true;
    }
    return type === "IDAT" || type === "IEND";
  });
  return found;
}
export { hasTrnsChunk, pngNeedsBrowserDecode, sniffFormat };
