// renderer/types/page.ts
function resolvePageSize(size, orientation) {
  let w, h;
  if (typeof size === "object") {
    w = size.width;
    h = size.height;
    if (!Number.isFinite(w) || !Number.isFinite(h) || w <= 0 || h <= 0) {
      throw new Error(
        `[taepdf] Invalid custom page size {width: ${w}, height: ${h}} \u2014 both must be finite, positive numbers.`,
      );
    }
  } else {
    const presets = {
      A3: [841.89, 1190.55],
      A4: [595.28, 841.89],
      A5: [419.53, 595.28],
      Letter: [612, 792],
      Legal: [612, 1008],
      Tabloid: [792, 1224],
    };
    const [pw, ph] = presets[size] ?? presets.A4;
    w = pw;
    h = ph;
  }
  if (orientation === "landscape")
    return { width: Math.max(w, h), height: Math.min(w, h) };
  return { width: w, height: h };
}
export { resolvePageSize };
