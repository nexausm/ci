// renderer/html/borderimage.ts
import { PX_PER_PT, domRectToPt, paginateSpan, stackOpacity } from "./types.js";
import { pxToPt, parseCSSGradient, parseCSSConicGradient } from "./css.js";
import { extractBgUrl } from "./images.js";
function parseSideValues(v) {
  const toks = v.trim().split(/\s+/).filter(Boolean);
  return [
    toks[0],
    toks[1] ?? toks[0],
    toks[2] ?? toks[0],
    toks[3] ?? toks[1] ?? toks[0],
  ];
}
function parseSlice(v, naturalW, naturalH) {
  const fill = /\bfill\b/.test(v);
  const clean = v.replace(/\bfill\b/, "").trim();
  const [t, r, b, l] = parseSideValues(clean);
  const resolve = (tok, ref) => {
    const pctM = tok.match(/^(-?[\d.]+)%$/);
    if (pctM) return (+pctM[1] / 100) * ref;
    return parseFloat(tok) || 0;
  };
  return {
    top: resolve(t, naturalH),
    right: resolve(r, naturalW),
    bottom: resolve(b, naturalH),
    left: resolve(l, naturalW),
    fill,
  };
}
function parseWidth(v, borderW, boxW, boxH) {
  const [t, r, b, l] = parseSideValues(v);
  const resolve = (tok, side, ref) => {
    const pctM = tok.match(/^(-?[\d.]+)%$/);
    if (pctM) return (+pctM[1] / 100) * ref;
    const pxM = tok.match(/^(-?[\d.]+)px$/);
    if (pxM) return +pxM[1] / PX_PER_PT;
    const n = parseFloat(tok);
    return isNaN(n) ? side : n * side;
  };
  return {
    top: resolve(t, borderW.top, boxH),
    right: resolve(r, borderW.right, boxW),
    bottom: resolve(b, borderW.bottom, boxH),
    left: resolve(l, borderW.left, boxW),
  };
}
function parseOutset(v, borderW) {
  const [t, r, b, l] = parseSideValues(v);
  const resolve = (tok, side) => {
    const pxM = tok.match(/^(-?[\d.]+)px$/);
    if (pxM) return +pxM[1] / PX_PER_PT;
    const n = parseFloat(tok);
    return isNaN(n) ? 0 : n * side;
  };
  return {
    top: resolve(t, borderW.top),
    right: resolve(r, borderW.right),
    bottom: resolve(b, borderW.bottom),
    left: resolve(l, borderW.left),
  };
}
function parseRepeat(v) {
  const toks = v.trim().split(/\s+/);
  const h = toks[0] || "stretch";
  const w = toks[1] || h;
  return [h, w];
}
function loadImageElement(url) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = url;
  });
}
function paintGradientToCanvas(canvas, g) {
  const ctx = canvas.getContext("2d");
  const w = canvas.width,
    h = canvas.height;
  let grad;
  if (g.type === "linear") {
    const rad = (g.angle * Math.PI) / 180;
    const dx = Math.sin(rad),
      dy = -Math.cos(rad);
    const half = Math.abs(w * dx) / 2 + Math.abs(h * dy) / 2;
    const cx = w / 2,
      cy = h / 2;
    grad = ctx.createLinearGradient(
      cx - dx * half,
      cy - dy * half,
      cx + dx * half,
      cy + dy * half,
    );
  } else {
    const cx = (g.cx ?? 0.5) * w,
      cy = (g.cy ?? 0.5) * h;
    const r = Math.hypot(Math.max(cx, w - cx), Math.max(cy, h - cy));
    grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
  }
  for (const st of g.stops) {
    const [r, gr, b, a] = st.color;
    grad.addColorStop(
      Math.min(1, Math.max(0, st.position)),
      `rgba(${r},${gr},${b},${a / 255})`,
    );
  }
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);
}
function paintConicToCanvas(canvas, cg) {
  const ctx = canvas.getContext("2d");
  if (!ctx || typeof ctx.createConicGradient !== "function") return;
  const grad = ctx.createConicGradient(
    ((cg.fromDeg - 90) * Math.PI) / 180,
    cg.cx * canvas.width,
    cg.cy * canvas.height,
  );
  for (const st of cg.stops) {
    const [r, g, b, a] = st.color;
    grad.addColorStop(
      Math.min(1, Math.max(0, st.position)),
      `rgba(${r},${g},${b},${a / 255})`,
    );
  }
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
}
async function resolveSourceCanvas(source, boxWpx, boxHpx) {
  const url = extractBgUrl(source);
  if (url) {
    const img = await loadImageElement(url);
    if (!img || !img.naturalWidth || !img.naturalHeight) return null;
    const canvas2 = document.createElement("canvas");
    canvas2.width = img.naturalWidth;
    canvas2.height = img.naturalHeight;
    canvas2.getContext("2d").drawImage(img, 0, 0);
    return { canvas: canvas2, w: canvas2.width, h: canvas2.height };
  }
  const w = Math.max(1, Math.round(boxWpx)),
    h = Math.max(1, Math.round(boxHpx));
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const g = parseCSSGradient(source);
  if (g) {
    paintGradientToCanvas(canvas, g);
    return { canvas, w, h };
  }
  const cg = parseCSSConicGradient(source);
  if (cg) {
    paintConicToCanvas(canvas, cg);
    return { canvas, w, h };
  }
  return null;
}
function cropToPng(src, sx, sy, sw, sh) {
  if (sw <= 0 || sh <= 0) return null;
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(sw));
  canvas.height = Math.max(1, Math.round(sh));
  const ctx = canvas.getContext("2d");
  ctx.drawImage(src.canvas, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height);
  const dataUrl = canvas.toDataURL("image/png");
  const comma = dataUrl.indexOf(",");
  if (comma < 0) return null;
  const bin = atob(dataUrl.slice(comma + 1));
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}
var MAX_BORDER_TILES = 500;
function tilePositions(mode, length, tileSize) {
  if (mode === "stretch" || tileSize <= 0.01)
    return { positions: [0], size: length };
  if (mode === "round") {
    const count2 = Math.min(
      MAX_BORDER_TILES,
      Math.max(1, Math.round(length / tileSize)),
    );
    return {
      positions: Array.from(
        { length: count2 },
        (_, i) => i * (length / count2),
      ),
      size: length / count2,
    };
  }
  if (mode === "space") {
    const count2 = Math.min(
      MAX_BORDER_TILES,
      Math.max(1, Math.floor(length / tileSize)),
    );
    if (count2 <= 1)
      return { positions: [(length - tileSize) / 2], size: tileSize };
    const gap = (length - count2 * tileSize) / (count2 - 1);
    return {
      positions: Array.from({ length: count2 }, (_, i) => i * (tileSize + gap)),
      size: tileSize,
    };
  }
  const count = Math.min(
    MAX_BORDER_TILES,
    Math.max(1, Math.ceil(length / tileSize)),
  );
  return {
    positions: Array.from({ length: count }, (_, i) => i * tileSize),
    size: tileSize,
  };
}
function hasBorderImage(s) {
  const src = s.borderImageSource;
  return !!src && src !== "none";
}
async function emitBorderImage(el, s, ctx) {
  const source = s.borderImageSource;
  if (!source || source === "none") return;
  const domRect = el.getBoundingClientRect();
  const { x, y, w, h } = domRectToPt(domRect, ctx.containerRect);
  if (w <= 0 || h <= 0) return;
  const borderW = {
    top: pxToPt(s.borderTopWidth || "0px"),
    right: pxToPt(s.borderRightWidth || "0px"),
    bottom: pxToPt(s.borderBottomWidth || "0px"),
    left: pxToPt(s.borderLeftWidth || "0px"),
  };
  const src = await resolveSourceCanvas(source, w * PX_PER_PT, h * PX_PER_PT);
  if (!src) return;
  const slice = parseSlice(s.borderImageSlice || "100%", src.w, src.h);
  const width = parseWidth(s.borderImageWidth || "1", borderW, w, h);
  const outset = parseOutset(s.borderImageOutset || "0", borderW);
  const [repeatH, repeatV] = parseRepeat(s.borderImageRepeat || "stretch");
  const X = x - outset.left,
    Y = y - outset.top;
  const W = w + outset.left + outset.right,
    H = h + outset.top + outset.bottom;
  const { top: wt, right: wr, bottom: wb, left: wl } = width;
  const midW = Math.max(0, W - wl - wr),
    midH = Math.max(0, H - wt - wb);
  const sT = slice.top,
    sR = slice.right,
    sB = slice.bottom,
    sL = slice.left;
  const srcMidW = Math.max(0, src.w - sL - sR),
    srcMidH = Math.max(0, src.h - sT - sB);
  const regions = [
    { sx: 0, sy: 0, sw: sL, sh: sT, dx: X, dy: Y, dw: wl, dh: wt },
    {
      sx: src.w - sR,
      sy: 0,
      sw: sR,
      sh: sT,
      dx: X + W - wr,
      dy: Y,
      dw: wr,
      dh: wt,
    },
    {
      sx: 0,
      sy: src.h - sB,
      sw: sL,
      sh: sB,
      dx: X,
      dy: Y + H - wb,
      dw: wl,
      dh: wb,
    },
    {
      sx: src.w - sR,
      sy: src.h - sB,
      sw: sR,
      sh: sB,
      dx: X + W - wr,
      dy: Y + H - wb,
      dw: wr,
      dh: wb,
    },
    {
      sx: sL,
      sy: 0,
      sw: srcMidW,
      sh: sT,
      dx: X + wl,
      dy: Y,
      dw: midW,
      dh: wt,
      repeatX: repeatH,
    },
    {
      sx: sL,
      sy: src.h - sB,
      sw: srcMidW,
      sh: sB,
      dx: X + wl,
      dy: Y + H - wb,
      dw: midW,
      dh: wb,
      repeatX: repeatH,
    },
    {
      sx: 0,
      sy: sT,
      sw: sL,
      sh: srcMidH,
      dx: X,
      dy: Y + wt,
      dw: wl,
      dh: midH,
      repeatY: repeatV,
    },
    {
      sx: src.w - sR,
      sy: sT,
      sw: sR,
      sh: srcMidH,
      dx: X + W - wr,
      dy: Y + wt,
      dw: wr,
      dh: midH,
      repeatY: repeatV,
    },
  ];
  if (slice.fill) {
    regions.push({
      sx: sL,
      sy: sT,
      sw: srcMidW,
      sh: srcMidH,
      dx: X + wl,
      dy: Y + wt,
      dw: midW,
      dh: midH,
      repeatX: repeatH,
      repeatY: repeatV,
    });
  }
  const opacity = stackOpacity(ctx);
  for (const r of regions) {
    if (r.dw <= 0.01 || r.dh <= 0.01 || r.sw <= 0 || r.sh <= 0) continue;
    const png = cropToPng(src, r.sx, r.sy, r.sw, r.sh);
    if (!png) continue;
    const naturalTileW = r.repeatX ? r.sw * (r.dh / r.sh) : r.dw;
    const naturalTileH = r.repeatY ? r.sh * (r.dw / r.sw) : r.dh;
    const tx = r.repeatX
      ? tilePositions(r.repeatX, r.dw, naturalTileW)
      : { positions: [0], size: r.dw };
    const ty = r.repeatY
      ? tilePositions(r.repeatY, r.dh, naturalTileH)
      : { positions: [0], size: r.dh };
    const needsTileClip = !!(r.repeatX || r.repeatY);
    for (const { page, y: boxLy } of paginateSpan(r.dy, r.dh, ctx.pageH)) {
      if (needsTileClip)
        ctx.commands.push({
          type: "clip-push",
          page,
          x: r.dx,
          y: boxLy,
          w: r.dw,
          h: r.dh,
        });
      for (const px of tx.positions) {
        for (const py of ty.positions) {
          ctx.commands.push({
            type: "image",
            page,
            src: png,
            format: "png",
            x: r.dx + px,
            y: boxLy + py,
            w: tx.size,
            h: ty.size,
            opacity,
          });
        }
      }
      if (needsTileClip) ctx.commands.push({ type: "clip-pop", page });
    }
  }
}
export { emitBorderImage, hasBorderImage };
