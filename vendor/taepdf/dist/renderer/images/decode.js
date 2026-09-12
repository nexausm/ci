// renderer/images/decode.ts
var _decodeCache = /* @__PURE__ */ new Map();
function clearDecodeCache() {
  _decodeCache.clear();
}
function decodeToRaw(bytes) {
  if (_decodeCache.has(bytes)) return _decodeCache.get(bytes);
  const p = decodeToRawUncached(bytes);
  _decodeCache.set(bytes, p);
  return p;
}
async function decodeToRawUncached(bytes) {
  try {
    const blob = new Blob([bytes]);
    let bmp;
    try {
      bmp = await createImageBitmap(blob, {
        premultiplyAlpha: "none",
        colorSpaceConversion: "none",
      });
    } catch {
      bmp = await createImageBitmap(blob);
    }
    const w = bmp.width,
      h = bmp.height;
    if (!w || !h) {
      bmp.close();
      return null;
    }
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const c2d = canvas.getContext("2d", { willReadFrequently: true });
    if (!c2d) {
      bmp.close();
      return null;
    }
    c2d.drawImage(bmp, 0, 0);
    bmp.close();
    const rgba = c2d.getImageData(0, 0, w, h).data;
    const n = w * h;
    let hasAlpha = false;
    let isGray = true;
    for (let i = 0; i < n; i++) {
      const o = i * 4;
      if (rgba[o + 3] !== 255) hasAlpha = true;
      if (rgba[o] !== rgba[o + 1] || rgba[o + 1] !== rgba[o + 2])
        isGray = false;
      if (hasAlpha && !isGray) break;
    }
    const data = new Uint8Array(isGray ? n : n * 3);
    for (let i = 0; i < n; i++) {
      const o = i * 4;
      if (isGray) {
        data[i] = rgba[o];
      } else {
        data[i * 3] = rgba[o];
        data[i * 3 + 1] = rgba[o + 1];
        data[i * 3 + 2] = rgba[o + 2];
      }
    }
    let smask = null;
    if (hasAlpha) {
      smask = new Uint8Array(n);
      for (let i = 0; i < n; i++) smask[i] = rgba[i * 4 + 3];
    }
    return {
      width: w,
      height: h,
      colorSpace: isGray ? "DeviceGray" : "DeviceRGB",
      data,
      smask,
    };
  } catch {
    return null;
  }
}
export { clearDecodeCache, decodeToRaw };
