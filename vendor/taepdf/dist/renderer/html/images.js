// renderer/html/images.ts
import { PX_PER_PT, domRectToPt, paginateSpan, stackOpacity } from "./types.js";
import {
  pxToPt,
  parseBorderRadius,
  insetBorderRadius,
  splitByTopLevelComma,
  splitPositionPair,
  parseColorAlpha,
} from "./css.js";
import { sniffFormat, pngNeedsBrowserDecode } from "../images/sniff.js";
import { decodeToRaw, clearDecodeCache } from "../images/decode.js";
import { svgToVectorShapes } from "../pdf/svgvector.js";
function pushVectorShapes(ctx, page, shapes, dy, opacity) {
  for (const shape of shapes) {
    const ops =
      dy === 0
        ? shape.ops
        : shape.ops.map((seg) => ({
            op: seg.op,
            args: seg.args.map((v, i) => (i % 2 === 1 ? v + dy : v)),
          }));
    const gradientBox =
      shape.gradientBox &&
      (dy === 0
        ? shape.gradientBox
        : { ...shape.gradientBox, y: shape.gradientBox.y + dy });
    ctx.commands.push({
      type: "path",
      page,
      ops,
      evenOdd: shape.evenOdd,
      fill: shape.fill,
      stroke: shape.stroke,
      strokeWidth: shape.strokeWidth,
      dashArray: shape.dashArray,
      lineCap: shape.lineCap,
      lineJoin: shape.lineJoin,
      gradient: shape.gradient,
      gradientBox,
      opacity:
        opacity !== void 0 && shape.opacity !== void 0
          ? opacity * shape.opacity
          : (opacity ?? shape.opacity),
    });
  }
}
var _imageCache = /* @__PURE__ */ new Map();
var _dataUriCache = /* @__PURE__ */ new Map();
function invalidateImageCache() {
  _imageCache.clear();
  _dataUriCache.clear();
  _naturalSizeCache.clear();
  clearDecodeCache();
}
function _dataUriKey(uri) {
  let h1 = 5381,
    h2 = 52711;
  for (let i = 0; i < uri.length; i++) {
    const c = uri.charCodeAt(i);
    h1 = (h1 * 33) ^ c;
    h2 = (h2 * 31 + c) | 0;
  }
  return (
    uri.length + ":" + (h1 >>> 0).toString(36) + ":" + (h2 >>> 0).toString(36)
  );
}
function _fetchImageCached(url) {
  if (!_imageCache.has(url)) {
    const p = fetch(url)
      .then((r) =>
        r.ok ? r.arrayBuffer().then((b) => new Uint8Array(b)) : null,
      )
      .catch(() => null);
    p.then((result) => {
      if (!result) _imageCache.delete(url);
    });
    _imageCache.set(url, p);
  }
  return _imageCache.get(url);
}
async function resolveImage(srcUrl) {
  let src = null;
  let format = "png";
  if (srcUrl.startsWith("data:")) {
    const comma = srcUrl.indexOf(",");
    if (comma < 0) return null;
    const header = srcUrl.slice(0, comma);
    if (header.includes("svg")) format = "svg";
    else if (header.includes("jpeg") || header.includes("jpg")) format = "jpg";
    const duKey = _dataUriKey(srcUrl);
    if (_dataUriCache.has(duKey)) {
      src = _dataUriCache.get(duKey);
    } else if (header.includes(";base64")) {
      try {
        const bin = atob(srcUrl.slice(comma + 1));
        src = new Uint8Array(bin.length);
        for (let i = 0; i < bin.length; i++) src[i] = bin.charCodeAt(i);
      } catch {
        _dataUriCache.set(duKey, null);
        return null;
      }
      _dataUriCache.set(duKey, src);
    } else {
      try {
        src = new TextEncoder().encode(
          decodeURIComponent(srcUrl.slice(comma + 1)),
        );
      } catch {
        _dataUriCache.set(duKey, null);
        return null;
      }
      _dataUriCache.set(duKey, src);
    }
  } else {
    const ext = srcUrl.split("?")[0].split(".").pop()?.toLowerCase();
    if (ext === "svg") format = "svg";
    else if (ext === "jpg" || ext === "jpeg") format = "jpg";
    src = await _fetchImageCached(srcUrl);
  }
  if (!src) return null;
  if (format !== "svg") {
    const f = sniffFormat(src);
    const wasmHandles =
      f === "jpeg" || (f === "png" && !pngNeedsBrowserDecode(src));
    if (!wasmHandles) {
      if (f !== "png" && f !== "webp" && f !== "avif") return null;
      const raw = await decodeToRaw(src);
      return raw ? { kind: "raw", raw } : null;
    }
  }
  return { kind: "bytes", src, format };
}
function extractBgUrl(layer) {
  const m = layer.match(/^url\(["']?([^"')]+)["']?\)$/);
  return m ? m[1] : null;
}
function parsePositionComponent(val, availableSpace) {
  if (!val) return availableSpace / 2;
  const pctM = val.match(/^(-?[\d.]+)%$/);
  if (pctM) return availableSpace * (+pctM[1] / 100);
  const pxM = val.match(/^(-?[\d.]+)px$/);
  if (pxM) return +pxM[1] / PX_PER_PT;
  const calcM = val.match(/^calc\((-?[\d.]+)%\s*([+-])\s*(-?[\d.]+)px\)$/);
  if (calcM) {
    const base = availableSpace * (+calcM[1] / 100);
    const off = +calcM[3] / PX_PER_PT;
    return calcM[2] === "+" ? base + off : base - off;
  }
  return availableSpace / 2;
}
function computeObjectFitRect(
  fit,
  position,
  boxX,
  boxY,
  boxW,
  boxH,
  naturalW,
  naturalH,
) {
  if (fit === "fill" || !naturalW || !naturalH) {
    return { x: boxX, y: boxY, w: boxW, h: boxH, needsClip: false };
  }
  let drawW, drawH;
  if (fit === "none") {
    drawW = naturalW;
    drawH = naturalH;
  } else {
    const scaleContain = Math.min(boxW / naturalW, boxH / naturalH);
    const scaleCover = Math.max(boxW / naturalW, boxH / naturalH);
    const scale = fit === "cover" ? scaleCover : scaleContain;
    drawW = naturalW * scale;
    drawH = naturalH * scale;
    if (fit === "scale-down" && naturalW <= drawW && naturalH <= drawH) {
      drawW = naturalW;
      drawH = naturalH;
    }
  }
  const [posXRaw, posYRaw] = splitPositionPair(position || "50% 50%");
  const offX = parsePositionComponent(posXRaw, boxW - drawW);
  const offY = parsePositionComponent(posYRaw, boxH - drawH);
  const eps = 0.01;
  const needsClip = drawW > boxW + eps || drawH > boxH + eps;
  return { x: boxX + offX, y: boxY + offY, w: drawW, h: drawH, needsClip };
}
async function emitImage(el, ctx) {
  const domRect = el.getBoundingClientRect();
  if (domRect.width < 1 || domRect.height < 1) return;
  const { x, y, w, h } = domRectToPt(domRect, ctx.containerRect);
  const srcUrl = el.currentSrc || el.src || "";
  if (!srcUrl) return;
  const img = await resolveImage(srcUrl);
  if (!img) {
    console.warn(`[taepdf] Could not fetch image: ${srcUrl}`);
    return;
  }
  const cs = getComputedStyle(el);
  const insL =
    pxToPt(cs.borderLeftWidth || "0px") + pxToPt(cs.paddingLeft || "0px");
  const insT =
    pxToPt(cs.borderTopWidth || "0px") + pxToPt(cs.paddingTop || "0px");
  const insR =
    pxToPt(cs.borderRightWidth || "0px") + pxToPt(cs.paddingRight || "0px");
  const insB =
    pxToPt(cs.borderBottomWidth || "0px") + pxToPt(cs.paddingBottom || "0px");
  const cbX = x + insL,
    cbY = y + insT;
  const cbW = Math.max(0, w - insL - insR);
  const cbH = Math.max(0, h - insT - insB);
  if (cbW <= 0 || cbH <= 0) return;
  const naturalW = (el.naturalWidth || 0) / PX_PER_PT;
  const naturalH = (el.naturalHeight || 0) / PX_PER_PT;
  const fit = computeObjectFitRect(
    cs.objectFit || "fill",
    cs.objectPosition,
    cbX,
    cbY,
    cbW,
    cbH,
    naturalW,
    naturalH,
  );
  const clipRadius = insetBorderRadius(
    parseBorderRadius(cs, el),
    insT,
    insR,
    insB,
    insL,
  );
  const needsClip = fit.needsClip || !!clipRadius;
  const opacity = stackOpacity(ctx);
  let vectorShapes = null;
  if (img.kind === "bytes" && img.format === "svg") {
    const svgStr = new TextDecoder().decode(img.src);
    const currentColor = parseColorAlpha(cs.color) ?? [0, 0, 0, 255];
    vectorShapes = svgToVectorShapes(
      svgStr,
      fit.x,
      fit.y,
      fit.w,
      fit.h,
      currentColor,
    );
  }
  for (const { page, y: boxLy } of paginateSpan(cbY, cbH, ctx.pageH)) {
    const pageOffset = cbY - boxLy;
    const imgLy = fit.y - pageOffset;
    if (needsClip)
      ctx.commands.push({
        type: "clip-push",
        page,
        x: cbX,
        y: boxLy,
        w: cbW,
        h: cbH,
        radius: clipRadius,
      });
    if (vectorShapes) {
      pushVectorShapes(ctx, page, vectorShapes, imgLy - fit.y, opacity);
    } else {
      ctx.commands.push(
        img.kind === "raw"
          ? {
              type: "raw-image",
              page,
              raw: img.raw,
              x: fit.x,
              y: imgLy,
              w: fit.w,
              h: fit.h,
              opacity,
            }
          : {
              type: "image",
              page,
              src: img.src,
              format: img.format,
              x: fit.x,
              y: imgLy,
              w: fit.w,
              h: fit.h,
              opacity,
            },
      );
    }
    if (needsClip) ctx.commands.push({ type: "clip-pop", page });
  }
}
function emitCanvas(el, ctx) {
  const domRect = el.getBoundingClientRect();
  if (domRect.width < 1 || domRect.height < 1) return;
  if (!el.width || !el.height) return;
  let dataUrl;
  try {
    dataUrl = el.toDataURL("image/png");
  } catch {
    return;
  }
  const comma = dataUrl.indexOf(",");
  if (comma < 0) return;
  const bin = atob(dataUrl.slice(comma + 1));
  const src = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) src[i] = bin.charCodeAt(i);
  const { x, y, w, h } = domRectToPt(domRect, ctx.containerRect);
  const cs = getComputedStyle(el);
  const insL =
    pxToPt(cs.borderLeftWidth || "0px") + pxToPt(cs.paddingLeft || "0px");
  const insT =
    pxToPt(cs.borderTopWidth || "0px") + pxToPt(cs.paddingTop || "0px");
  const insR =
    pxToPt(cs.borderRightWidth || "0px") + pxToPt(cs.paddingRight || "0px");
  const insB =
    pxToPt(cs.borderBottomWidth || "0px") + pxToPt(cs.paddingBottom || "0px");
  const cbX = x + insL,
    cbY = y + insT;
  const cbW = Math.max(0, w - insL - insR);
  const cbH = Math.max(0, h - insT - insB);
  if (cbW <= 0 || cbH <= 0) return;
  const clipRadius = insetBorderRadius(
    parseBorderRadius(cs, el),
    insT,
    insR,
    insB,
    insL,
  );
  const opacity = stackOpacity(ctx);
  for (const { page, y: ly } of paginateSpan(cbY, cbH, ctx.pageH)) {
    if (clipRadius)
      ctx.commands.push({
        type: "clip-push",
        page,
        x: cbX,
        y: ly,
        w: cbW,
        h: cbH,
        radius: clipRadius,
      });
    ctx.commands.push({
      type: "image",
      page,
      src,
      format: "png",
      x: cbX,
      y: ly,
      w: cbW,
      h: cbH,
      opacity,
    });
    if (clipRadius) ctx.commands.push({ type: "clip-pop", page });
  }
}
async function emitInlineSVG(el, ctx) {
  const domRect = el.getBoundingClientRect();
  if (domRect.width < 1 || domRect.height < 1) return;
  const { x, y, w, h } = domRectToPt(domRect, ctx.containerRect);
  const cs = getComputedStyle(el);
  const clone = el.cloneNode(true);
  clone.style.color = cs.color;
  clone.style.fontFamily = cs.fontFamily;
  clone.style.fontSize = cs.fontSize;
  clone.setAttribute("width", String(domRect.width));
  clone.setAttribute("height", String(domRect.height));
  const svgStr = new XMLSerializer().serializeToString(clone);
  const opacity = stackOpacity(ctx);
  const currentColor = parseColorAlpha(cs.color) ?? [0, 0, 0, 255];
  const shapes = svgToVectorShapes(svgStr, x, y, w, h, currentColor);
  if (shapes) {
    for (const { page, y: ly } of paginateSpan(y, h, ctx.pageH)) {
      pushVectorShapes(ctx, page, shapes, ly - y, opacity);
    }
    return;
  }
  const src = new TextEncoder().encode(svgStr);
  for (const { page, y: ly } of paginateSpan(y, h, ctx.pageH)) {
    ctx.commands.push({
      type: "image",
      page,
      src,
      format: "svg",
      x,
      y: ly,
      w,
      h,
      opacity,
    });
  }
}
var _naturalSizeCache = /* @__PURE__ */ new Map();
async function getNaturalSize(bytes) {
  if (_naturalSizeCache.has(bytes)) return _naturalSizeCache.get(bytes);
  const p = createImageBitmap(new Blob([bytes]))
    .then((bmp) => {
      const size = { w: bmp.width, h: bmp.height };
      bmp.close();
      return size;
    })
    .catch(() => null);
  _naturalSizeCache.set(bytes, p);
  return p;
}
function nthCyclic(list, i) {
  return list[i % list.length]?.trim() ?? "";
}
function parseBgSize(sizeStr, boxW, boxH, naturalW, naturalH) {
  const val = sizeStr || "auto";
  if (val === "cover" || val === "contain") {
    if (!naturalW || !naturalH) return { tileW: boxW, tileH: boxH };
    const scale =
      val === "cover"
        ? Math.max(boxW / naturalW, boxH / naturalH)
        : Math.min(boxW / naturalW, boxH / naturalH);
    return { tileW: naturalW * scale, tileH: naturalH * scale };
  }
  const parseComponent = (v, ref) => {
    if (!v || v === "auto") return null;
    const pctM = v.match(/^(-?[\d.]+)%$/);
    if (pctM) return ref * (+pctM[1] / 100);
    const pxM = v.match(/^(-?[\d.]+)px$/);
    if (pxM) return +pxM[1] / PX_PER_PT;
    return null;
  };
  const [wRaw, hRaw] = val.split(/\s+/);
  let tw = parseComponent(wRaw, boxW);
  let th = parseComponent(hRaw, boxH);
  if (tw === null && th === null) {
    tw = naturalW || boxW;
    th = naturalH || boxH;
  } else if (tw === null && th !== null) {
    tw = naturalW && naturalH ? (naturalW / naturalH) * th : boxW;
  } else if (th === null && tw !== null) {
    th = naturalW && naturalH ? (naturalH / naturalW) * tw : boxH;
  }
  return { tileW: tw ?? boxW, tileH: th ?? boxH };
}
function parseBgRepeat(repeatStr) {
  const parts = (repeatStr || "repeat").trim().split(/\s+/);
  let rx, ry;
  if (parts.length === 1) {
    const v = parts[0];
    if (v === "repeat-x") {
      rx = "repeat";
      ry = "no-repeat";
    } else if (v === "repeat-y") {
      rx = "no-repeat";
      ry = "repeat";
    } else {
      rx = v;
      ry = v;
    }
  } else {
    rx = parts[0];
    ry = parts[1];
  }
  return { repeatX: rx !== "no-repeat", repeatY: ry !== "no-repeat" };
}
var MAX_BG_TILES = 500;
async function emitBgImage(el, srcUrl, ctx, layerIndex = 0, layerCount = 1) {
  const domRect = el.getBoundingClientRect();
  if (domRect.width < 1 || domRect.height < 1) return;
  const { x, y, w, h } = domRectToPt(domRect, ctx.containerRect);
  const img = await resolveImage(srcUrl);
  if (!img) {
    console.warn(`[taepdf] Could not resolve background-image: ${srcUrl}`);
    return;
  }
  const cs = getComputedStyle(el);
  const pick = (list, fallback) =>
    (layerCount > 1
      ? nthCyclic(list, layerIndex)
      : (list[0]?.trim() ?? fallback)) || fallback;
  const sizeStr = pick(
    splitByTopLevelComma(cs.backgroundSize || "auto"),
    "auto",
  );
  const positionStr = pick(
    splitByTopLevelComma(cs.backgroundPosition || "0% 0%"),
    "0% 0%",
  );
  const repeatStr = pick(
    splitByTopLevelComma(cs.backgroundRepeat || "repeat"),
    "repeat",
  );
  const originStr = pick(
    splitByTopLevelComma(cs.backgroundOrigin || "padding-box"),
    "padding-box",
  );
  const clipStr = pick(
    splitByTopLevelComma(cs.backgroundClip || "border-box"),
    "border-box",
  );
  const fixed =
    pick(
      splitByTopLevelComma(cs.backgroundAttachment || "scroll"),
      "scroll",
    ) === "fixed";
  if (clipStr === "text") return;
  const bT = pxToPt(cs.borderTopWidth || "0px"),
    bR = pxToPt(cs.borderRightWidth || "0px");
  const bB = pxToPt(cs.borderBottomWidth || "0px"),
    bL = pxToPt(cs.borderLeftWidth || "0px");
  const pT = pxToPt(cs.paddingTop || "0px"),
    pR = pxToPt(cs.paddingRight || "0px");
  const pB = pxToPt(cs.paddingBottom || "0px"),
    pL = pxToPt(cs.paddingLeft || "0px");
  const boxFor = (kind) => {
    if (kind === "border-box") return { x, y, w, h };
    if (kind === "content-box")
      return {
        x: x + bL + pL,
        y: y + bT + pT,
        w: Math.max(0, w - bL - bR - pL - pR),
        h: Math.max(0, h - bT - bB - pT - pB),
      };
    return {
      x: x + bL,
      y: y + bT,
      w: Math.max(0, w - bL - bR),
      h: Math.max(0, h - bT - bB),
    };
  };
  const origin = fixed
    ? { x: 0, y: 0, w: ctx.pageW, h: ctx.pageH }
    : boxFor(originStr);
  const clip = boxFor(clipStr);
  if (clip.w <= 0 || clip.h <= 0) return;
  const natural =
    img.kind === "raw"
      ? { w: img.raw.width, h: img.raw.height }
      : img.format === "svg"
        ? null
        : await getNaturalSize(img.src);
  const naturalW = (natural?.w ?? 0) / PX_PER_PT;
  const naturalH = (natural?.h ?? 0) / PX_PER_PT;
  const { tileW, tileH } = parseBgSize(
    sizeStr,
    origin.w,
    origin.h,
    naturalW,
    naturalH,
  );
  const { repeatX, repeatY } = parseBgRepeat(repeatStr);
  const [posXRaw, posYRaw] = splitPositionPair(positionStr);
  const refX = origin.x + parsePositionComponent(posXRaw, origin.w - tileW);
  const refY = origin.y + parsePositionComponent(posYRaw, origin.h - tileH);
  const coverX0 = fixed ? 0 : clip.x,
    coverX1 = fixed ? ctx.pageW : clip.x + clip.w;
  const coverY0 = fixed ? 0 : clip.y,
    coverY1 = fixed ? ctx.pageH : clip.y + clip.h;
  const tileXs = [];
  if (tileW > 0.01 && repeatX) {
    const first = refX - Math.ceil((refX - coverX0) / tileW) * tileW;
    for (
      let tx = first;
      tx < coverX1 && tileXs.length < MAX_BG_TILES;
      tx += tileW
    )
      tileXs.push(tx);
  } else {
    tileXs.push(refX);
  }
  const tileYs = [];
  if (tileH > 0.01 && repeatY) {
    const first = refY - Math.ceil((refY - coverY0) / tileH) * tileH;
    for (
      let ty = first;
      ty < coverY1 && tileYs.length < MAX_BG_TILES;
      ty += tileH
    )
      tileYs.push(ty);
  } else {
    tileYs.push(refY);
  }
  const MAX_BG_TILE_PRODUCT = 2e3;
  if (tileXs.length * tileYs.length > MAX_BG_TILE_PRODUCT) {
    const scale = Math.sqrt(
      MAX_BG_TILE_PRODUCT / (tileXs.length * tileYs.length),
    );
    tileXs.length = Math.max(1, Math.floor(tileXs.length * scale));
    tileYs.length = Math.max(1, Math.floor(tileYs.length * scale));
  }
  const clipRadius = insetBorderRadius(
    parseBorderRadius(cs, el),
    clipStr === "border-box" ? 0 : clipStr === "content-box" ? bT + pT : bT,
    clipStr === "border-box" ? 0 : clipStr === "content-box" ? bR + pR : bR,
    clipStr === "border-box" ? 0 : clipStr === "content-box" ? bB + pB : bB,
    clipStr === "border-box" ? 0 : clipStr === "content-box" ? bL + pL : bL,
  );
  const opacity = stackOpacity(ctx);
  const needsClip =
    repeatX || repeatY || tileW !== clip.w || tileH !== clip.h || !!clipRadius;
  for (const { page, y: boxLy } of paginateSpan(clip.y, clip.h, ctx.pageH)) {
    const pageOffset = fixed ? 0 : clip.y - boxLy;
    const yLo = fixed ? boxLy : clip.y,
      yHi = fixed ? boxLy + clip.h : clip.y + clip.h;
    if (needsClip)
      ctx.commands.push({
        type: "clip-push",
        page,
        x: clip.x,
        y: boxLy,
        w: clip.w,
        h: clip.h,
        radius: clipRadius,
      });
    for (const tx of tileXs) {
      if (tx + tileW < clip.x || tx > clip.x + clip.w) continue;
      for (const ty of tileYs) {
        if (ty + tileH < yLo || ty > yHi) continue;
        ctx.commands.push(
          img.kind === "raw"
            ? {
                type: "raw-image",
                page,
                raw: img.raw,
                x: tx,
                y: ty - pageOffset,
                w: tileW,
                h: tileH,
                opacity,
              }
            : {
                type: "image",
                page,
                src: img.src,
                format: img.format,
                x: tx,
                y: ty - pageOffset,
                w: tileW,
                h: tileH,
                opacity,
              },
        );
      }
    }
    if (needsClip) ctx.commands.push({ type: "clip-pop", page });
  }
}
export {
  emitBgImage,
  emitCanvas,
  emitImage,
  emitInlineSVG,
  extractBgUrl,
  invalidateImageCache,
};
