// renderer/images/pngchunks.ts
function forEachChunk(b, visit) {
  if (
    b.length < 33 ||
    b[12] !== 73 ||
    b[13] !== 72 ||
    b[14] !== 68 ||
    b[15] !== 82
  )
    return;
  const u32 = (o) =>
    ((b[o] << 24) | (b[o + 1] << 16) | (b[o + 2] << 8) | b[o + 3]) >>> 0;
  const ihdrLen = u32(8);
  let pos = 8 + 4 + 4 + ihdrLen + 4;
  while (pos + 8 <= b.length) {
    const clen = u32(pos);
    const type = String.fromCharCode(
      b[pos + 4],
      b[pos + 5],
      b[pos + 6],
      b[pos + 7],
    );
    const dend = pos + 8 + clen;
    if (dend > b.length) return;
    if (visit(type, b.subarray(pos + 8, dend))) return;
    pos = dend + 4;
  }
}
export { forEachChunk };
