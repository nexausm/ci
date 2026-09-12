// renderer/pdf/svg.ts
function _hashBytes(bytes) {
  let h1 = 5381,
    h2 = 52711;
  for (let i = 0; i < bytes.length; i++) {
    const b = bytes[i];
    h1 = (Math.imul(h1, 33) ^ b) >>> 0;
    h2 = (h2 * 31 + b) | 0;
  }
  return bytes.length + ":" + h1.toString(36) + ":" + (h2 >>> 0).toString(36);
}
function svgToPng(svgBytes, drawW, drawH) {
  return new Promise((resolve, reject) => {
    const blob = new Blob([svgBytes], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);
    const img = new Image();
    const dpr = 3;
    img.onload = () => {
      URL.revokeObjectURL(url);
      try {
        const canvas = document.createElement("canvas");
        canvas.width = Math.round(drawW * dpr);
        canvas.height = Math.round(drawH * dpr);
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        canvas.toBlob((blob2) => {
          if (!blob2) {
            reject(new Error("SVG rasterization failed"));
            return;
          }
          blob2
            .arrayBuffer()
            .then((buf) => resolve(new Uint8Array(buf)))
            .catch(reject);
        }, "image/png");
      } catch (err) {
        reject(err instanceof Error ? err : new Error(String(err)));
      }
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("SVG load failed"));
    };
    img.src = url;
  });
}
async function rasterizeSVGs(commands) {
  const byContent = /* @__PURE__ */ new Map();
  const keyOf = (c) => `${_hashBytes(c.src)}|${c.w}|${c.h}`;
  const jobs = [];
  for (const cmd of commands) {
    if (cmd.type !== "image") continue;
    const c = cmd;
    if (c.format !== "svg") continue;
    const key = keyOf(c);
    if (!byContent.has(key)) {
      byContent.set(
        key,
        svgToPng(c.src, c.w, c.h).catch((err) => {
          console.warn(
            "[taepdf] SVG rasterization failed \u2014 image skipped.",
            err,
          );
          return new Uint8Array(0);
        }),
      );
    }
    jobs.push({ cmd: c, key });
  }
  await Promise.all(byContent.values());
  for (const { cmd, key } of jobs) {
    const png = await byContent.get(key);
    if (png.length > 0) {
      cmd.src = png;
      cmd.format = "png";
    }
  }
}
export { rasterizeSVGs };
