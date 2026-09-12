// renderer/html/emit.ts
import { measure_string_width } from "../../engine.js";
import {
  PX_PER_PT,
  domRectToPt,
  paginate,
  paginateSpan,
  stackOpacity,
  stackBlend,
} from "./types.js";
import {
  parseColorAlpha,
  parseCSSBoxShadow,
  parseCSSGradient,
  parseCSSConicGradient,
  tileStops,
  parseBorderRadius,
  clampRadiusToBox,
  insetBorderRadius,
  pxToPt,
  splitByTopLevelComma,
  isTransparentColor,
} from "./css.js";
import { resolveFontRef, splitByFontCoverage } from "./fonts.js";
import {
  romanNumeral,
  alphaLabel,
  applyCounters,
  popCounters,
  resolveContentList,
} from "./counters.js";
import { hasBorderImage } from "./borderimage.js";
function normBorderStyle(s) {
  if (s === "dashed") return "dashed";
  if (s === "dotted") return "dotted";
  if (s === "wavy") return "wavy";
  return "solid";
}
var RTL_RANGES = [
  [1425, 2303],
  // Hebrew through Arabic Extended-A
  [64285, 65023],
  // Hebrew + Arabic presentation forms-A
  [65136, 65279],
  // Arabic presentation forms-B
];
function isStrongRTL(cp) {
  return RTL_RANGES.some(([a, b]) => cp >= a && cp <= b);
}
function hasBidiMix(text) {
  let sawRTL = false,
    sawLTR = false;
  for (const ch of text) {
    const cp = ch.codePointAt(0);
    if (isStrongRTL(cp)) sawRTL = true;
    else if (/\p{L}/u.test(ch)) sawLTR = true;
    if (sawRTL && sawLTR) return true;
  }
  return false;
}
function splitColorAlpha(ca) {
  if (!ca) return { color: null, alpha: 1 };
  return { color: [ca[0], ca[1], ca[2]], alpha: ca[3] / 255 };
}
function combineOpacity(base, extra) {
  const combined = (base ?? 1) * extra;
  return combined < 1 ? combined : void 0;
}
function resolveGradientBox(gradient, w, h) {
  if (w <= 0 || h <= 0) return gradient;
  if (gradient.type === "linear" && gradient.corner) {
    const a = (Math.atan2(h, w) * 180) / Math.PI;
    const cornerAngle = {
      "top right": a,
      "bottom right": 180 - a,
      "bottom left": 180 + a,
      "top left": 360 - a,
    };
    gradient = {
      ...gradient,
      angle: cornerAngle[gradient.corner] ?? gradient.angle,
    };
  }
  if (gradient.stops.some((st) => st.posPx !== void 0)) {
    let linePt;
    if (gradient.type === "linear") {
      const rad = (gradient.angle * Math.PI) / 180;
      linePt = Math.abs(w * Math.sin(rad)) + Math.abs(h * Math.cos(rad));
    } else {
      const cxPt = (gradient.cx ?? 0.5) * w;
      const cyPt = (gradient.cy ?? 0.5) * h;
      linePt = Math.hypot(Math.max(cxPt, w - cxPt), Math.max(cyPt, h - cyPt));
    }
    if (linePt > 0) {
      gradient = {
        ...gradient,
        stops: gradient.stops.map((st) =>
          st.posPx !== void 0
            ? { color: st.color, position: st.posPx / PX_PER_PT / linePt }
            : st,
        ),
      };
    }
  }
  if (gradient.repeating) {
    gradient = {
      ...gradient,
      repeating: void 0,
      stops: tileStops(gradient.stops, true),
    };
  }
  return gradient;
}
var _conicCache = /* @__PURE__ */ new Map();
function rasterizeConic(cg, wPt, hPt) {
  if (wPt <= 0 || hPt <= 0) return null;
  const key = `${cg.fromDeg}|${cg.cx}|${cg.cy}|${cg.repeating ?? false}|${cg.stops.map((st) => `${st.position}:${st.color}`).join(",")}|${wPt.toFixed(2)}|${hPt.toFixed(2)}`;
  const hit = _conicCache.get(key);
  if (hit !== void 0) return hit;
  let out = null;
  try {
    const dpr = 3;
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(wPt * dpr));
    canvas.height = Math.max(1, Math.round(hPt * dpr));
    const c2d = canvas.getContext("2d");
    if (c2d && typeof c2d.createConicGradient === "function") {
      const grad = c2d.createConicGradient(
        ((cg.fromDeg - 90) * Math.PI) / 180,
        cg.cx * canvas.width,
        cg.cy * canvas.height,
      );
      const stops = tileStops(cg.stops, cg.repeating);
      for (const st of stops) {
        const [r, g, b, a] = st.color;
        grad.addColorStop(
          Math.min(1, Math.max(0, st.position)),
          `rgba(${r},${g},${b},${a / 255})`,
        );
      }
      c2d.fillStyle = grad;
      c2d.fillRect(0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL("image/png");
      const comma = dataUrl.indexOf(",");
      if (comma >= 0) {
        const bin = atob(dataUrl.slice(comma + 1));
        out = new Uint8Array(bin.length);
        for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
      }
    }
  } catch {
    out = null;
  }
  _conicCache.set(key, out);
  return out;
}
function suppressRadiusSide(radius, suppressLeft, suppressRight) {
  if (!radius || (!suppressLeft && !suppressRight)) return radius;
  const a = radius.all ?? 0;
  const c = (x) => (x ? { h: x.h, v: x.v } : { h: a, v: a });
  const tl = c(radius.topLeft),
    tr = c(radius.topRight);
  const br = c(radius.bottomRight),
    bl = c(radius.bottomLeft);
  if (suppressLeft) {
    tl.h = 0;
    tl.v = 0;
    bl.h = 0;
    bl.v = 0;
  }
  if (suppressRight) {
    tr.h = 0;
    tr.v = 0;
    br.h = 0;
    br.v = 0;
  }
  return { topLeft: tl, topRight: tr, bottomRight: br, bottomLeft: bl };
}
function emitBox(el, s, ctx) {
  const isInline = s.display === "inline";
  const rects = isInline
    ? Array.from(el.getClientRects())
    : [el.getBoundingClientRect()];
  const opacity = stackOpacity(ctx);
  const blend = stackBlend(ctx);
  const boxDecorationBreak =
    s.boxDecorationBreak === "clone" ? "clone" : "slice";
  for (let rectIndex = 0; rectIndex < rects.length; rectIndex++) {
    const domRect = rects[rectIndex];
    if (domRect.width < 0.5 && domRect.height < 0.5) continue;
    const { x, y, w, h } = domRectToPt(domRect, ctx.containerRect);
    const { color: bgColor, alpha: bgAlpha } = splitColorAlpha(
      parseColorAlpha(s.backgroundColor),
    );
    const baseRadius = isInline
      ? clampRadiusToBox(parseBorderRadius(s, el), w, h)
      : parseBorderRadius(s, el);
    const shadows = parseCSSBoxShadow(s.boxShadow);
    const bgImg = s.backgroundImage;
    const fragmented =
      isInline && rects.length > 1 && boxDecorationBreak === "slice";
    const suppressLeft = fragmented && rectIndex > 0;
    const suppressRight = fragmented && rectIndex < rects.length - 1;
    const radius = suppressRadiusSide(baseRadius, suppressLeft, suppressRight);
    const sides = ["Top", "Right", "Bottom", "Left"];
    const bWidths = sides.map((d) => pxToPt(s[`border${d}Width`] ?? "0px"));
    const bColorAlphas = sides.map((d) =>
      parseColorAlpha(s[`border${d}Color`] ?? ""),
    );
    const bStyles = sides.map((d) => s[`border${d}Style`] ?? "none");
    const allSame =
      bWidths.every((v) => v === bWidths[0]) &&
      bStyles.every((v) => v === bStyles[0]) &&
      bColorAlphas.every(
        (c, i) => JSON.stringify(c) === JSON.stringify(bColorAlphas[0]),
      );
    const uniformSolid =
      !fragmented &&
      allSame &&
      bStyles[0] !== "dashed" &&
      bStyles[0] !== "dotted" &&
      bStyles[0] !== "double";
    const bgClipList = String(
      s.webkitBackgroundClip || s.backgroundClip || "border-box",
    )
      .split(",")
      .map((t) => t.trim());
    const bgClipText = bgClipList[bgClipList.length - 1] === "text";
    const paintsFill = !bgClipText && !!bgColor;
    const oWidth = pxToPt(s.outlineWidth || "0px");
    const oStyle = s.outlineStyle;
    const oColorA =
      oWidth > 0 && oStyle && oStyle !== "none"
        ? parseColorAlpha(s.outlineColor)
        : null;
    const oGrow = oColorA ? pxToPt(s.outlineOffset || "0px") + oWidth : 0;
    let oRadius;
    if (oColorA && radius) {
      const a = radius.all ?? 0;
      const grown = (c) => {
        const base = c ?? { h: a, v: a };
        if (base.h <= 0 || base.v <= 0) return { h: 0, v: 0 };
        return {
          h: Math.max(0, base.h + oGrow),
          v: Math.max(0, base.v + oGrow),
        };
      };
      oRadius = {
        topLeft: grown(radius.topLeft),
        topRight: grown(radius.topRight),
        bottomRight: grown(radius.bottomRight),
        bottomLeft: grown(radius.bottomLeft),
      };
    }
    const computeGeom = (effH) => {
      const clipBoxFor = (kind) => {
        const box = { dx: 0, dy: 0, w, h: effH, radius };
        if (kind !== "padding-box" && kind !== "content-box") return box;
        const pad = kind === "content-box";
        const iT = bWidths[0] + (pad ? pxToPt(s.paddingTop || "0px") : 0);
        const iR = bWidths[1] + (pad ? pxToPt(s.paddingRight || "0px") : 0);
        const iB = bWidths[2] + (pad ? pxToPt(s.paddingBottom || "0px") : 0);
        const iL = bWidths[3] + (pad ? pxToPt(s.paddingLeft || "0px") : 0);
        if (!iT && !iR && !iB && !iL) return box;
        return {
          dx: iL,
          dy: iT,
          w: Math.max(0, w - iL - iR),
          h: Math.max(0, effH - iT - iB),
          radius: insetBorderRadius(radius, iT, iR, iB, iL),
        };
      };
      const colorClip = bgClipList[bgClipList.length - 1];
      const fillBox = clipBoxFor(colorClip);
      const fillInset =
        fillBox.dx !== 0 ||
        fillBox.dy !== 0 ||
        fillBox.w !== w ||
        fillBox.h !== effH;
      const bgLayers = [];
      if (bgImg && bgImg !== "none") {
        const layerList = splitByTopLevelComma(bgImg);
        for (let i = layerList.length - 1; i >= 0; i--) {
          const kind = bgClipList[i % bgClipList.length] ?? "border-box";
          if (kind === "text") continue;
          const layer = layerList[i].trim();
          const g = parseCSSGradient(layer);
          if (g) {
            const box = clipBoxFor(kind);
            if (box.w > 0 && box.h > 0)
              bgLayers.push({
                gradient: resolveGradientBox(g, box.w, box.h),
                box,
              });
            continue;
          }
          const cg = parseCSSConicGradient(layer);
          if (cg) {
            const box = clipBoxFor(kind);
            const src = rasterizeConic(cg, box.w, box.h);
            if (src) bgLayers.push({ conicSrc: src, box });
          }
        }
      }
      return { fillBox, fillInset, bgLayers };
    };
    const spans = paginateSpan(y, h, ctx.pageH);
    const blockClone =
      !isInline && boxDecorationBreak === "clone" && spans.length > 1;
    const defaultGeom = blockClone ? null : computeGeom(h);
    for (const { page, y: ly } of spans) {
      let by = ly,
        bh = h;
      if (blockClone) {
        const fragTop = Math.max(0, ly);
        const fragBottom = Math.min(ctx.pageH, ly + h);
        bh = fragBottom - fragTop;
        if (bh <= 0.01) continue;
        by = fragTop;
      }
      const { fillBox, fillInset, bgLayers } = blockClone
        ? computeGeom(bh)
        : defaultGeom;
      const splitShadow = shadows.length > 0 && (bgClipText || fillInset);
      if (splitShadow) {
        ctx.commands.push({
          type: "rect",
          page,
          x,
          y: by,
          w,
          h: bh,
          fill: null,
          shadow: shadows,
          radius,
          opacity,
          blend,
        });
      }
      if (paintsFill || (shadows.length && !splitShadow)) {
        ctx.commands.push({
          type: "rect",
          page,
          x: x + fillBox.dx,
          y: by + fillBox.dy,
          w: fillBox.w,
          h: fillBox.h,
          fill: paintsFill ? (bgColor ?? null) : null,
          shadow: splitShadow ? void 0 : shadows.length ? shadows : void 0,
          radius: fillBox.radius,
          opacity: combineOpacity(opacity, bgAlpha),
          blend,
        });
      }
      for (const L of bgLayers) {
        const lx = x + L.box.dx,
          lyy = by + L.box.dy;
        if (L.gradient) {
          ctx.commands.push({
            type: "rect",
            page,
            x: lx,
            y: lyy,
            w: L.box.w,
            h: L.box.h,
            fill: null,
            gradient: L.gradient,
            radius: L.box.radius,
            opacity,
            blend,
          });
        } else if (L.conicSrc) {
          const rounded = !!L.box.radius;
          if (rounded)
            ctx.commands.push({
              type: "clip-push",
              page,
              x: lx,
              y: lyy,
              w: L.box.w,
              h: L.box.h,
              radius: L.box.radius,
            });
          ctx.commands.push({
            type: "image",
            page,
            src: L.conicSrc,
            format: "png",
            x: lx,
            y: lyy,
            w: L.box.w,
            h: L.box.h,
            opacity,
            blend,
          });
          if (rounded) ctx.commands.push({ type: "clip-pop", page });
        }
      }
      if (!hasBorderImage(s)) {
        if (
          uniformSolid &&
          bWidths[0] > 0 &&
          bStyles[0] !== "none" &&
          bColorAlphas[0]
        ) {
          const { color: strokeColor, alpha: strokeAlpha } = splitColorAlpha(
            bColorAlphas[0],
          );
          ctx.commands.push({
            type: "rect",
            page,
            x,
            y: by,
            w,
            h: bh,
            fill: null,
            stroke: strokeColor,
            strokeWidth: bWidths[0],
            radius,
            opacity: combineOpacity(opacity, strokeAlpha),
            blend,
          });
        } else if (
          !fragmented &&
          allSame &&
          radius &&
          bWidths[0] > 0 &&
          bColorAlphas[0] &&
          (bStyles[0] === "dashed" || bStyles[0] === "dotted")
        ) {
          const { color: strokeColor, alpha: strokeAlpha } = splitColorAlpha(
            bColorAlphas[0],
          );
          ctx.commands.push({
            type: "rect",
            page,
            x,
            y: by,
            w,
            h: bh,
            fill: null,
            stroke: strokeColor,
            strokeWidth: bWidths[0],
            strokeStyle: bStyles[0],
            radius,
            opacity: combineOpacity(opacity, strokeAlpha),
            blend,
          });
        } else {
          const sideLine = (i, off) =>
            i === 0
              ? { x1: x, y1: by + off, x2: x + w, y2: by + off }
              : i === 1
                ? { x1: x + w - off, y1: by, x2: x + w - off, y2: by + bh }
                : i === 2
                  ? { x1: x, y1: by + bh - off, x2: x + w, y2: by + bh - off }
                  : { x1: x + off, y1: by, x2: x + off, y2: by + bh };
          for (let i = 0; i < 4; i++) {
            if ((i === 3 && suppressLeft) || (i === 1 && suppressRight))
              continue;
            if (bWidths[i] > 0 && bStyles[i] !== "none" && bColorAlphas[i]) {
              const { color: lineColor, alpha: lineAlpha } = splitColorAlpha(
                bColorAlphas[i],
              );
              const lineOpacity = combineOpacity(opacity, lineAlpha);
              if (bStyles[i] === "double" && bWidths[i] >= 2) {
                const t = bWidths[i];
                for (const off of [t / 6, (t * 5) / 6]) {
                  ctx.commands.push({
                    type: "line",
                    page,
                    ...sideLine(i, off),
                    width: t / 3,
                    color: lineColor,
                    lineStyle: "solid",
                    opacity: lineOpacity,
                    blend,
                  });
                }
                continue;
              }
              ctx.commands.push({
                type: "line",
                page,
                ...sideLine(i, bWidths[i] / 2),
                width: bWidths[i],
                color: lineColor,
                lineStyle: normBorderStyle(bStyles[i]),
                opacity: lineOpacity,
                blend,
              });
            }
          }
        }
      }
      if (oColorA && w + oGrow * 2 > 0 && bh + oGrow * 2 > 0) {
        const { color: oc, alpha: oa } = splitColorAlpha(oColorA);
        ctx.commands.push({
          type: "rect",
          page,
          x: x - oGrow,
          y: by - oGrow,
          w: w + oGrow * 2,
          h: bh + oGrow * 2,
          fill: null,
          stroke: oc,
          strokeWidth: oWidth,
          strokeStyle:
            oStyle === "dashed" || oStyle === "dotted" ? oStyle : void 0,
          radius: oRadius,
          opacity: combineOpacity(opacity, oa),
          blend,
        });
      }
    }
  }
}
function applyTextTransform(text, transform) {
  if (transform === "uppercase") return text.toUpperCase();
  if (transform === "lowercase") return text.toLowerCase();
  if (transform === "capitalize")
    return text.replace(
      /(^|[^\p{L}\p{N}'’])(\p{L})/gu,
      (_, p, c) => p + c.toUpperCase(),
    );
  return text;
}
function isFirstContentOfBlock(textNode) {
  let n = textNode.previousSibling;
  while (n) {
    if (n.nodeType === Node.ELEMENT_NODE) return false;
    if (n.nodeType === Node.TEXT_NODE && (n.textContent ?? "").trim())
      return false;
    n = n.previousSibling;
  }
  return true;
}
function pseudoTextOverride(el, which, s) {
  const p = getComputedStyle(el, which);
  const differs =
    p.fontSize !== s.fontSize ||
    p.fontFamily !== s.fontFamily ||
    p.fontWeight !== s.fontWeight ||
    p.fontStyle !== s.fontStyle ||
    p.color !== s.color ||
    p.letterSpacing !== s.letterSpacing ||
    p.textTransform !== s.textTransform ||
    (which === "::first-letter" && p.cssFloat !== "none");
  return differs ? p : null;
}
function baselineNeedsWrapper(parentEl) {
  const d = getComputedStyle(parentEl).display;
  return (
    d === "flex" || d === "inline-flex" || d === "grid" || d === "inline-grid"
  );
}
function measureBaselineY(parentEl, textNode, before) {
  const anchor = document.createElement("span");
  anchor.style.cssText =
    "display:inline;font-size:0;line-height:0;vertical-align:baseline;";
  if (!baselineNeedsWrapper(parentEl)) {
    parentEl.insertBefore(anchor, before ? textNode : textNode.nextSibling);
    const y2 = anchor.getBoundingClientRect().top;
    parentEl.removeChild(anchor);
    return y2;
  }
  const wrapper = document.createElement("span");
  wrapper.style.cssText = "display:inline;";
  parentEl.insertBefore(wrapper, textNode);
  if (before) {
    wrapper.appendChild(anchor);
    wrapper.appendChild(textNode);
  } else {
    wrapper.appendChild(textNode);
    wrapper.appendChild(anchor);
  }
  const y = anchor.getBoundingClientRect().top;
  parentEl.insertBefore(textNode, wrapper);
  parentEl.removeChild(wrapper);
  return y;
}
function captureVerticalTextNode(textNode, parentEl, s, ctx) {
  const raw = textNode.textContent ?? "";
  if (!raw.trim()) return;
  if (s.visibility === "hidden" || s.visibility === "collapse") return;
  const fontRef = resolveFontRef(
    s.fontFamily,
    s.fontWeight,
    s.fontStyle,
    ctx.fontMap,
    ctx.registeredFonts,
  );
  if (!fontRef) {
    const fam = s.fontFamily.split(",")[0].replace(/["']/g, "").trim();
    console.warn(
      `[taepdf] Font "${fam}" is not registered \u2014 vertical text skipped. Register via loadFontsFromManifest() or loadAndRegisterFont().`,
    );
    return;
  }
  const sizePx = parseFloat(s.fontSize) || 16;
  const sizePt = sizePx / PX_PER_PT;
  const colorAlphaVal = parseColorAlpha(s.color);
  const color = colorAlphaVal
    ? [colorAlphaVal[0], colorAlphaVal[1], colorAlphaVal[2]]
    : [0, 0, 0];
  const opacity = stackOpacity(ctx);
  const blend = stackBlend(ctx);
  const chars = [...raw];
  const range = document.createRange();
  const hits = [];
  let charIdx = 0;
  for (const ch of chars) {
    range.setStart(textNode, charIdx);
    range.setEnd(textNode, charIdx + ch.length);
    const r = range.getBoundingClientRect();
    charIdx += ch.length;
    if (r.width < 0.01 && r.height < 0.01) continue;
    hits.push({ ch, rect: r });
  }
  range.detach?.();
  if (!hits.length) return;
  const columns = [];
  for (const hit of hits) {
    const left = hit.rect.left;
    const existing = columns.find((c) => Math.abs(c.left - left) < 3);
    if (existing) {
      existing.chars.push(hit);
      existing.minTop = Math.min(existing.minTop, hit.rect.top);
    } else {
      columns.push({ chars: [hit], left, minTop: hit.rect.top });
    }
  }
  columns.sort((a, b) =>
    s.writingMode === "vertical-lr" ? a.left - b.left : b.left - a.left,
  );
  for (const col of columns) {
    const text = col.chars.map((c) => c.ch).join("");
    if (!text.trim()) continue;
    const colLeft = Math.min(...col.chars.map((c) => c.rect.left));
    const colRight = Math.max(...col.chars.map((c) => c.rect.right));
    const colX = (colLeft - ctx.containerRect.left) / PX_PER_PT;
    const colTopPx = col.minTop - ctx.containerRect.top;
    const { page, y: ly } = paginate(colTopPx / PX_PER_PT, ctx.pageH);
    ctx.commands.push({
      type: "text",
      page,
      text,
      vertical: true,
      x: colX,
      y: ly,
      font: fontRef.name,
      style: fontRef.style,
      weight: fontRef.weight,
      size: sizePt,
      color,
      align: "left",
      maxWidth: (colRight - colLeft) / PX_PER_PT,
      opacity,
      blend,
    });
  }
}
function captureTextNode(textNode, parentEl, s, ctx) {
  const raw = textNode.textContent ?? "";
  if (!raw.trim()) return;
  if (s.visibility === "hidden" || s.visibility === "collapse") return;
  const fontRef = resolveFontRef(
    s.fontFamily,
    s.fontWeight,
    s.fontStyle,
    ctx.fontMap,
    ctx.registeredFonts,
  );
  if (!fontRef) {
    const fam = s.fontFamily.split(",")[0].replace(/["']/g, "").trim();
    console.warn(
      `[taepdf] Font "${fam}" is not registered \u2014 text skipped. Register via loadFontsFromManifest() or loadAndRegisterFont().`,
    );
    return;
  }
  const sizePx = parseFloat(s.fontSize) || 16;
  const sizePt = sizePx / PX_PER_PT;
  const colorSrc = String(s.webkitTextFillColor || s.color);
  const colorAlphaVal = parseColorAlpha(colorSrc);
  const { color: colorRgb, alpha: colorAlpha } = splitColorAlpha(colorAlphaVal);
  let color = colorRgb ?? [0, 0, 0];
  let drawText = true;
  if (colorAlphaVal === null && isTransparentColor(colorSrc)) {
    let sub = null;
    const clipsText = String(
      s.webkitBackgroundClip || s.backgroundClip || "",
    ).includes("text");
    if (clipsText) {
      if (s.backgroundImage && s.backgroundImage !== "none") {
        for (const layer of splitByTopLevelComma(s.backgroundImage)) {
          const g = parseCSSGradient(layer.trim());
          if (g?.stops.length) {
            sub = [
              g.stops[0].color[0],
              g.stops[0].color[1],
              g.stops[0].color[2],
            ];
            break;
          }
        }
      }
      if (!sub) {
        const bg = parseColorAlpha(s.backgroundColor);
        if (bg) sub = [bg[0], bg[1], bg[2]];
      }
    }
    if (sub) color = sub;
    else if (!clipsText) drawText = false;
  }
  const lsPt =
    s.letterSpacing === "normal" ? void 0 : pxToPt(s.letterSpacing) || void 0;
  const wsPt =
    s.wordSpacing === "normal" ? void 0 : pxToPt(s.wordSpacing) || void 0;
  const txform = s.textTransform;
  const opacity = stackOpacity(ctx);
  const blend = stackBlend(ctx);
  const textOpacity = combineOpacity(opacity, colorAlpha);
  const tsWidthPt = pxToPt(String(s.webkitTextStrokeWidth || "0px"));
  const tsCA =
    tsWidthPt > 0
      ? parseColorAlpha(String(s.webkitTextStrokeColor || ""))
      : null;
  const textStroke = tsCA
    ? { color: [tsCA[0], tsCA[1], tsCA[2]], width: tsWidthPt }
    : null;
  let strokeOnly = false;
  if (textStroke && !drawText) {
    drawText = true;
    strokeOnly = true;
  }
  const decos = [];
  {
    const seen = /* @__PURE__ */ new Set();
    let decoEl = parentEl;
    let decoStyle = s;
    while (decoEl) {
      const dl = decoStyle.textDecorationLine;
      if (dl && dl !== "none") {
        for (const part of dl.split(" ")) {
          if (seen.has(part)) continue;
          seen.add(part);
          const dcRaw = decoStyle.textDecorationColor;
          const ca =
            parseColorAlpha(dcRaw) ??
            (isTransparentColor(dcRaw)
              ? null
              : parseColorAlpha(decoStyle.color));
          if (!ca) continue;
          const thM = (decoStyle.textDecorationThickness || "").match(
            /^(-?[\d.]+)px$/,
          );
          const uoM = (decoStyle.textUnderlineOffset || "").match(
            /^(-?[\d.]+)px$/,
          );
          decos.push({
            part,
            color: [ca[0], ca[1], ca[2]],
            alpha: ca[3] / 255,
            lineStyle: normBorderStyle(decoStyle.textDecorationStyle),
            thicknessPt: thM ? Math.max(0.1, +thM[1] / PX_PER_PT) : void 0,
            underlineOffsetPt: uoM ? +uoM[1] / PX_PER_PT : void 0,
          });
        }
      }
      const d = decoStyle.display;
      if (
        decoStyle.position === "absolute" ||
        decoStyle.position === "fixed" ||
        decoStyle.cssFloat !== "none" ||
        d === "inline-block" ||
        d === "inline-table" ||
        d === "inline-flex" ||
        d === "inline-grid"
      )
        break;
      decoEl = decoEl.parentElement;
      if (!decoEl || decoEl === document.body) break;
      decoStyle = getComputedStyle(decoEl);
    }
  }
  if (!drawText && !decos.length) return;
  const blockish =
    s.display === "block" ||
    s.display === "list-item" ||
    s.display === "flow-root" ||
    s.display === "table-cell";
  const firstContent = blockish && isFirstContentOfBlock(textNode);
  const flStyle =
    firstContent && drawText
      ? pseudoTextOverride(parentEl, "::first-letter", s)
      : null;
  const fllStyle =
    firstContent && drawText
      ? pseudoTextOverride(parentEl, "::first-line", s)
      : null;
  let flStart = 0,
    flEnd = 0;
  if (flStyle) {
    const flM = raw.match(/^(\s*)([\p{P}\p{S}]*[\p{L}\p{N}][̀-ͯ]*)/u);
    if (flM) {
      flStart = flM[1].length;
      flEnd = flStart + flM[2].length;
    }
  }
  const range = document.createRange();
  const continuesWord = textNode.previousSibling?.nodeName === "WBR";
  const wordHits = [];
  const re = /\S+/g;
  re.lastIndex = flEnd;
  let m;
  while ((m = re.exec(raw)) !== null) {
    try {
      range.setStart(textNode, m.index);
      range.setEnd(textNode, m.index + m[0].length);
    } catch {
      continue;
    }
    const midWordChunk =
      txform === "capitalize" && m.index === 0 && continuesWord;
    const frags = Array.from(range.getClientRects()).filter(
      (fr) => fr.width > 0.1 && fr.height > 0.1,
    );
    if (frags.length <= 1) {
      const r = frags[0] ?? range.getBoundingClientRect();
      if (r.width < 0.1 && r.height < 0.1) continue;
      wordHits.push({
        text: midWordChunk ? m[0] : applyTextTransform(m[0], txform),
        rect: r,
        start: m.index,
        len: m[0].length,
      });
      continue;
    }
    let segStart = m.index;
    let prevTop = null;
    const closeSegment = (endIdx) => {
      if (endIdx <= segStart) return;
      range.setStart(textNode, segStart);
      range.setEnd(textNode, endIdx);
      const sr = range.getBoundingClientRect();
      if (sr.width < 0.1 && sr.height < 0.1) return;
      const slice = raw.slice(segStart, endIdx);
      const capAtStart = segStart === m.index && !midWordChunk;
      const segText =
        txform !== "capitalize" || capAtStart
          ? applyTextTransform(slice, txform)
          : slice;
      wordHits.push({
        text: segText,
        rect: sr,
        start: segStart,
        len: endIdx - segStart,
      });
    };
    for (let ci = 0; ci < m[0].length; ci++) {
      range.setStart(textNode, m.index + ci);
      range.setEnd(textNode, m.index + ci + 1);
      const cr = range.getBoundingClientRect();
      if (cr.width < 0.01 && cr.height < 0.01) continue;
      if (prevTop !== null && Math.abs(cr.top - prevTop) > 3) {
        closeSegment(m.index + ci);
        segStart = m.index + ci;
      }
      prevTop = cr.top;
    }
    closeSegment(m.index + m[0].length);
  }
  range.detach?.();
  if (s.hyphens === "auto") {
    for (let i = 0; i < wordHits.length - 1; i++) {
      const cur = wordHits[i],
        next = wordHits[i + 1];
      if (
        next.start === cur.start + cur.len &&
        Math.abs(next.rect.top - cur.rect.top) > 3
      ) {
        cur.text += "-";
      }
    }
  }
  if (!wordHits.length && !flEnd) return;
  const lines = [];
  for (const hit of wordHits) {
    const top = hit.rect.top;
    const existing = lines.find((l) => Math.abs(l.top - top) < 3);
    if (existing) {
      existing.words.push(hit);
      existing.minX = Math.min(existing.minX, hit.rect.left);
    } else {
      lines.push({ words: [hit], minX: hit.rect.left, top });
    }
  }
  const firstBaselineY =
    measureBaselineY(parentEl, textNode, true) - ctx.containerRect.top;
  if (flEnd > 0) {
    const flRange = document.createRange();
    flRange.setStart(textNode, flStart);
    flRange.setEnd(textNode, flEnd);
    const flRect = flRange.getBoundingClientRect();
    if (flRect.width > 0.1 && flRect.height > 0.1) {
      const flFont =
        resolveFontRef(
          flStyle.fontFamily,
          flStyle.fontWeight,
          flStyle.fontStyle,
          ctx.fontMap,
          ctx.registeredFonts,
        ) ?? fontRef;
      const flSizePx = parseFloat(flStyle.fontSize) || sizePx;
      const flCA = parseColorAlpha(
        String(flStyle.webkitTextFillColor || flStyle.color),
      );
      const floated = flStyle.cssFloat !== "none";
      const baselinePx = floated
        ? (flRect.top + flRect.bottom) / 2 -
          ctx.containerRect.top +
          flSizePx * 0.35
        : firstBaselineY;
      const { page, y: ly } = paginate(baselinePx / PX_PER_PT, ctx.pageH);
      ctx.commands.push({
        type: "text",
        page,
        text: applyTextTransform(
          raw.slice(flStart, flEnd),
          flStyle.textTransform,
        ),
        x: (flRect.left - ctx.containerRect.left) / PX_PER_PT,
        y: ly,
        font: flFont.name,
        style: flFont.style,
        weight: flFont.weight,
        size: flSizePx / PX_PER_PT,
        color: flCA ? [flCA[0], flCA[1], flCA[2]] : color,
        align: "left",
        maxWidth: flRect.width / PX_PER_PT + flSizePx / PX_PER_PT,
        opacity: combineOpacity(opacity, flCA ? flCA[3] / 255 : colorAlpha),
        blend,
      });
    }
  }
  if (!lines.length) return;
  const wsMode = s.whiteSpace;
  const perWord =
    s.textAlign === "justify" ||
    wsMode === "pre" ||
    wsMode === "pre-wrap" ||
    wsMode === "break-spaces" ||
    wsPt !== void 0 ||
    hasBidiMix(raw);
  const tShadows = parseCSSBoxShadow(s.textShadow);
  let ellipsisLimitPx = Infinity;
  if (
    drawText &&
    s.textOverflow === "ellipsis" &&
    wsMode === "nowrap" &&
    s.direction !== "rtl"
  ) {
    const ox = s.overflowX;
    if (ox === "hidden" || ox === "clip" || ox === "auto" || ox === "scroll") {
      const pe = parentEl;
      if (pe.scrollWidth > pe.clientWidth + 1) {
        const pr = pe.getBoundingClientRect();
        ellipsisLimitPx =
          pr.left +
          pe.clientLeft +
          pe.clientWidth -
          (parseFloat(s.paddingRight) || 0);
      }
    }
  }
  const firstLineTop = Math.min(...lines.map((l) => l.top));
  const ascentOffset = firstBaselineY - (firstLineTop - ctx.containerRect.top);
  const baseStyle = { fontRef, sizePt, color, textOpacity, lsPt };
  let fllResolved = null;
  let ascentOffsetRest = ascentOffset;
  if (fllStyle && lines.length) {
    const fllFont =
      resolveFontRef(
        fllStyle.fontFamily,
        fllStyle.fontWeight,
        fllStyle.fontStyle,
        ctx.fontMap,
        ctx.registeredFonts,
      ) ?? fontRef;
    const fllSizePx = parseFloat(fllStyle.fontSize) || sizePx;
    const fllCA = parseColorAlpha(
      String(fllStyle.webkitTextFillColor || fllStyle.color),
    );
    fllResolved = {
      fontRef: fllFont,
      sizePt: fllSizePx / PX_PER_PT,
      color: fllCA ? [fllCA[0], fllCA[1], fllCA[2]] : color,
      textOpacity: combineOpacity(opacity, fllCA ? fllCA[3] / 255 : colorAlpha),
      lsPt:
        fllStyle.letterSpacing === "normal"
          ? void 0
          : pxToPt(fllStyle.letterSpacing) || void 0,
    };
    if (lines.length > 1) {
      const lastBaselineY =
        measureBaselineY(parentEl, textNode, false) - ctx.containerRect.top;
      const lastLineTop = Math.max(...lines.map((l) => l.top));
      ascentOffsetRest = lastBaselineY - (lastLineTop - ctx.containerRect.top);
    }
  }
  for (let li = 0; li < lines.length; li++) {
    const line = lines[li];
    const st = li === 0 && fllResolved ? fllResolved : baseStyle;
    const famSrc = li === 0 && fllResolved ? fllStyle : s;
    const lineAscent =
      li === 0 ? ascentOffset : fllResolved ? ascentOffsetRest : ascentOffset;
    const lineText = line.words.map((w) => w.text).join(" ");
    if (!lineText.trim()) continue;
    const xPx = line.minX - ctx.containerRect.left;
    const yPx = line.top - ctx.containerRect.top + lineAscent;
    const xPt = xPx / PX_PER_PT;
    const yPt = yPx / PX_PER_PT;
    const rightEdge = Math.max(...line.words.map((w) => w.rect.right));
    const wPt = (rightEdge - ctx.containerRect.left) / PX_PER_PT - xPt;
    const { page, y: ly } = paginate(yPt, ctx.pageH);
    let lineOut = lineText;
    let truncated = false;
    if (ellipsisLimitPx !== Infinity) {
      const ellW =
        measure_string_width(
          "\u2026",
          fontRef.name,
          fontRef.style,
          fontRef.weight,
          0,
          sizePt,
        ) * PX_PER_PT;
      const limit = ellipsisLimitPx - ellW;
      const kept = [];
      for (const wd of line.words) {
        if (wd.rect.right <= limit) {
          kept.push(wd.text);
          continue;
        }
        truncated = true;
        if (wd.rect.left < limit) {
          let sub = "";
          for (let ci = 1; ci <= wd.len; ci++) {
            const r2 = document.createRange();
            r2.setStart(textNode, wd.start);
            r2.setEnd(textNode, wd.start + ci);
            if (r2.getBoundingClientRect().right > limit) break;
            sub = raw.slice(wd.start, wd.start + ci);
          }
          if (sub) kept.push(applyTextTransform(sub, txform));
        }
        break;
      }
      if (truncated) {
        const anyVisible = kept.length > 0 || line.words[0].rect.left < limit;
        lineOut = anyVisible ? kept.join(" ") + "\u2026" : "";
      }
      if (!lineOut) continue;
    }
    const emitRun = (txt, tx, maxW, font, ws) => {
      for (let si = tShadows.length - 1; si >= 0; si--) {
        const sh = tShadows[si];
        ctx.commands.push({
          type: "text",
          page,
          text: txt,
          x: tx + sh.x,
          y: ly + sh.y,
          font: font.name,
          style: font.style,
          weight: font.weight,
          size: st.sizePt,
          color: [sh.color[0], sh.color[1], sh.color[2]],
          align: "left",
          maxWidth: maxW,
          direction: s.direction === "rtl" ? "rtl" : "ltr",
          letterSpacing: st.lsPt,
          wordSpacing: ws,
          // blur is approximated by knocking the shadow's alpha down
          opacity: combineOpacity(
            opacity,
            ((sh.color[3] ?? 255) / 255) * (sh.blur ? 0.55 : 1),
          ),
          blend,
        });
      }
      ctx.commands.push({
        type: "text",
        page,
        text: txt,
        x: tx,
        y: ly,
        font: font.name,
        style: font.style,
        weight: font.weight,
        size: st.sizePt,
        color: st.color,
        align: "left",
        maxWidth: maxW,
        direction: s.direction === "rtl" ? "rtl" : "ltr",
        letterSpacing: st.lsPt,
        wordSpacing: ws,
        opacity: st.textOpacity,
        stroke: textStroke?.color,
        strokeWidth: textStroke?.width,
        strokeOnly: textStroke ? strokeOnly : void 0,
        blend,
      });
    };
    const emitTextCmd = (txt, tx, maxW, ws) => {
      if (s.direction === "rtl") {
        emitRun(txt, tx, maxW, st.fontRef, ws);
        return;
      }
      const runs = splitByFontCoverage(
        txt,
        st.fontRef,
        famSrc.fontFamily,
        famSrc.fontWeight,
        famSrc.fontStyle,
        ctx.fontMap,
        ctx.registeredFonts,
      );
      if (runs.length === 1) {
        emitRun(txt, tx, maxW, st.fontRef, ws);
        return;
      }
      let runX = tx;
      for (const run of runs) {
        const runWidthPt = measure_string_width(
          run.text,
          run.font.name,
          run.font.style,
          run.font.weight,
          0,
          st.sizePt,
        );
        emitRun(run.text, runX, runWidthPt, run.font, ws);
        runX += runWidthPt;
      }
    };
    if (drawText && perWord && !truncated) {
      for (const wd of line.words) {
        emitTextCmd(
          wd.text,
          (wd.rect.left - ctx.containerRect.left) / PX_PER_PT,
          wd.rect.width / PX_PER_PT,
        );
      }
    } else if (drawText) {
      emitTextCmd(lineOut, xPt, wPt || st.sizePt * lineOut.length * 0.6, wsPt);
    }
    for (const deco of decos) {
      let dy;
      if (deco.part === "underline")
        dy = ly + (deco.underlineOffsetPt ?? st.sizePt * 0.15);
      else if (deco.part === "overline") dy = ly - st.sizePt * 0.8;
      else if (deco.part === "line-through") dy = ly - st.sizePt * 0.3;
      else continue;
      ctx.commands.push({
        type: "line",
        page,
        x1: xPt,
        y1: dy,
        x2: xPt + wPt,
        y2: dy,
        width: deco.thicknessPt ?? Math.max(0.4, st.sizePt / 14),
        color: deco.color,
        lineStyle: deco.lineStyle,
        opacity: combineOpacity(opacity, deco.alpha),
        blend,
      });
    }
  }
}
function markerLabel(type, index) {
  switch (type) {
    case "disc":
      return "\u2022";
    case "circle":
      return "\u25E6";
    case "square":
      return "\u25AA";
    case "decimal":
      return `${index}.`;
    case "decimal-leading-zero":
      return `${index < 10 && index >= 0 ? "0" : ""}${index}.`;
    case "lower-alpha":
    case "lower-latin":
      return `${alphaLabel(index)}.`;
    case "upper-alpha":
    case "upper-latin":
      return `${alphaLabel(index).toUpperCase()}.`;
    case "lower-roman":
      return `${romanNumeral(index).toLowerCase()}.`;
    case "upper-roman":
      return `${romanNumeral(index)}.`;
    default:
      return "\u2022";
  }
}
function listIndex(el) {
  const li = el;
  if (li.value > 0) return li.value;
  let gap = 0;
  let sib = el.previousElementSibling;
  while (sib) {
    if (getComputedStyle(sib).display === "list-item") {
      gap++;
      const sibLi = sib;
      if (sibLi.value > 0) return sibLi.value + gap;
    }
    sib = sib.previousElementSibling;
  }
  const parent = el.parentElement;
  const start = parent instanceof HTMLOListElement ? parent.start : 1;
  return start + gap;
}
function emitListMarker(el, s, ctx) {
  if (s.display !== "list-item") return;
  const type = s.listStyleType;
  if (!type || type === "none") return;
  const ms = getComputedStyle(el, "::marker");
  if (ms.content === "none") return;
  let text = null;
  const strM = (ms.content ?? "").match(/^"((?:[^"\\]|\\.)*)"$/);
  if (strM) text = strM[1].replace(/\\(.)/g, "$1");
  if (text === null) text = markerLabel(type, listIndex(el));
  if (!text) return;
  const fontRef = resolveFontRef(
    s.fontFamily,
    s.fontWeight,
    s.fontStyle,
    ctx.fontMap,
    ctx.registeredFonts,
  );
  if (!fontRef) return;
  const probe = document.createElement("span");
  probe.style.cssText =
    "display:inline;font-size:0;line-height:0;vertical-align:baseline;visibility:hidden;pointer-events:none;";
  try {
    el.insertBefore(probe, el.firstChild);
    const pr = probe.getBoundingClientRect();
    el.removeChild(probe);
    const sizePx = parseFloat(s.fontSize) || 16;
    const sizePt = sizePx / PX_PER_PT;
    const markerW = measure_string_width(
      text,
      fontRef.name,
      fontRef.style,
      fontRef.weight,
      0,
      sizePt,
    );
    const gapPt = sizePt * 0.4;
    const xPt =
      (pr.left - ctx.containerRect.left) / PX_PER_PT - gapPt - markerW;
    const yPt = (pr.top - ctx.containerRect.top) / PX_PER_PT;
    const { page, y: ly } = paginate(yPt, ctx.pageH);
    const { color: clr, alpha } = splitColorAlpha(
      parseColorAlpha(ms.color || s.color),
    );
    ctx.commands.push({
      type: "text",
      page,
      text,
      x: xPt,
      y: ly,
      font: fontRef.name,
      style: fontRef.style,
      weight: fontRef.weight,
      size: sizePt,
      color: clr ?? [0, 0, 0],
      align: "left",
      maxWidth: markerW + sizePt,
      opacity: combineOpacity(stackOpacity(ctx), alpha),
    });
  } catch {
    try {
      el.removeChild(probe);
    } catch {}
  }
}
function isSafeHref(href) {
  if (href.startsWith("#")) return true;
  const lower = href.toLowerCase().trimStart();
  return (
    lower.startsWith("http://") ||
    lower.startsWith("https://") ||
    lower.startsWith("mailto:")
  );
}
function emitLinks(el, ctx) {
  const href = el.getAttribute("href");
  if (!href || !isSafeHref(href)) return;
  for (const domRect of Array.from(el.getClientRects())) {
    if (domRect.width < 1 || domRect.height < 1) continue;
    const { x, y, w, h } = domRectToPt(domRect, ctx.containerRect);
    for (const { page, y: ly } of paginateSpan(y, h, ctx.pageH)) {
      const sliceTop = Math.max(0, ly);
      const sliceH = Math.min(ctx.pageH, ly + h) - sliceTop;
      if (sliceH < 0.5) continue;
      ctx.commands.push({
        type: "link",
        page,
        href,
        x,
        y: sliceTop,
        w,
        h: sliceH,
      });
    }
  }
}
var TEXT_LIKE_INPUT_TYPES = /* @__PURE__ */ new Set([
  "text",
  "email",
  "tel",
  "url",
  "number",
  "password",
  "search",
  "",
]);
function emitFormField(el, s, ctx) {
  const tag = el.tagName.toUpperCase();
  const rect = el.getBoundingClientRect();
  if (rect.width < 1 || rect.height < 1) return;
  const { x, y, w, h } = domRectToPt(rect, ctx.containerRect);
  const { page, y: ly } = paginate(y, ctx.pageH);
  const color = parseColorAlpha(s.color);
  const rgb = color ? [color[0], color[1], color[2]] : [0, 0, 0];
  const name = el.name || `field${ctx.fieldCounter.n++}`;
  if (tag === "INPUT") {
    const inputType = (el.type || "text").toLowerCase();
    if (inputType === "checkbox" || inputType === "radio") {
      ctx.commands.push({
        type: "field",
        page,
        x,
        y: ly,
        w,
        h,
        name,
        font: "",
        style: "",
        weight: 400,
        size: 0,
        color: rgb,
        fieldType: "Btn",
        checked: el.checked,
      });
      return;
    }
  }
  const fontRef = resolveFontRef(
    s.fontFamily,
    s.fontWeight,
    s.fontStyle,
    ctx.fontMap,
    ctx.registeredFonts,
  );
  const sizePt = fontRef ? (parseFloat(s.fontSize) || 16) / PX_PER_PT : 0;
  const base = {
    type: "field",
    page,
    x,
    y: ly,
    w,
    h,
    name,
    font: fontRef?.name ?? "",
    style: fontRef?.style ?? "",
    weight: fontRef?.weight ?? 400,
    size: sizePt,
    color: rgb,
  };
  if (tag === "SELECT") {
    const select = el;
    const options = Array.from(select.options).map((o) => o.value || o.text);
    const sel = select.options[select.selectedIndex];
    ctx.commands.push({
      ...base,
      fieldType: "Ch",
      value: sel?.value || sel?.text || "",
      options,
    });
    return;
  }
  if (tag === "TEXTAREA") {
    ctx.commands.push({ ...base, fieldType: "Tx", value: el.value });
    return;
  }
  if (tag === "INPUT") {
    const input = el;
    const inputType = (input.type || "text").toLowerCase();
    if (TEXT_LIKE_INPUT_TYPES.has(inputType)) {
      ctx.commands.push({ ...base, fieldType: "Tx", value: input.value });
    }
  }
}
function captureAnchor(el, ctx) {
  if (!el.id) return;
  if (ctx.anchors.has(el.id)) return;
  const r = el.getBoundingClientRect();
  const yPt = (r.top - ctx.containerRect.top) / PX_PER_PT;
  const { page, y } = paginate(yPt, ctx.pageH);
  ctx.anchors.set(el.id, { page, y });
}
function pseudoBoxSpec(el, ps) {
  const wPx = parseFloat(ps.width);
  const hPx = parseFloat(ps.height);
  if (!(wPx > 0) || !(hPx > 0)) return null;
  const w = wPx / PX_PER_PT;
  const h = hPx / PX_PER_PT;
  const bgCA = parseColorAlpha(ps.backgroundColor);
  let gradient;
  if (ps.backgroundImage && ps.backgroundImage !== "none") {
    for (const layer of splitByTopLevelComma(ps.backgroundImage)) {
      gradient = parseCSSGradient(layer.trim()) ?? void 0;
      if (gradient) break;
    }
  }
  let border = null;
  const bw = pxToPt(ps.borderTopWidth || "0px");
  if (
    bw > 0 &&
    ps.borderTopStyle !== "none" &&
    ps.borderRightWidth === ps.borderTopWidth &&
    ps.borderBottomWidth === ps.borderTopWidth &&
    ps.borderLeftWidth === ps.borderTopWidth
  ) {
    const bCA = parseColorAlpha(ps.borderTopColor);
    if (bCA)
      border = { w: bw, color: [bCA[0], bCA[1], bCA[2]], alpha: bCA[3] / 255 };
  }
  if (!bgCA && !gradient && !border) return null;
  let dx = 0,
    dy = 0;
  if (ps.transform && ps.transform !== "none") {
    const m = ps.transform.match(
      /^matrix\(1,\s*0,\s*0,\s*1,\s*(-?[\d.]+),\s*(-?[\d.]+)\)$/,
    );
    if (!m) return null;
    dx = +m[1] / PX_PER_PT;
    dy = +m[2] / PX_PER_PT;
  }
  if (ps.position === "relative") {
    const rl = parseFloat(ps.left),
      rr = parseFloat(ps.right);
    const rt = parseFloat(ps.top),
      rb = parseFloat(ps.bottom);
    dx += (isFinite(rl) ? rl : isFinite(rr) ? -rr : 0) / PX_PER_PT;
    dy += (isFinite(rt) ? rt : isFinite(rb) ? -rb : 0) / PX_PER_PT;
  }
  const mlAuto = ps.marginLeft === "auto",
    mrAuto = ps.marginRight === "auto";
  const spec = {
    anchor: "flow",
    w,
    h,
    dx,
    dy,
    mL: mlAuto ? null : pxToPt(ps.marginLeft || "0px"),
    mR: mrAuto ? null : pxToPt(ps.marginRight || "0px"),
    mT: pxToPt(ps.marginTop || "0px"),
    mB: pxToPt(ps.marginBottom || "0px"),
    fill: bgCA ? [bgCA[0], bgCA[1], bgCA[2]] : null,
    fillAlpha: bgCA ? bgCA[3] / 255 : 1,
    gradient,
    border,
    radius: clampRadiusToBox(parseBorderRadius(ps, void 0, { w, h }), w, h),
  };
  const elS = getComputedStyle(el);
  if (ps.position === "absolute" || ps.position === "fixed") {
    if (elS.position === "static") return null;
    const hasH =
      isFinite(parseFloat(ps.left)) || isFinite(parseFloat(ps.right));
    const hasV =
      isFinite(parseFloat(ps.top)) || isFinite(parseFloat(ps.bottom));
    if (!hasH || !hasV) return null;
    spec.anchor = "abs";
    return spec;
  }
  if (ps.position !== "static" && ps.position !== "relative") return null;
  const elD = elS.display;
  if (
    elD !== "block" &&
    elD !== "inline-block" &&
    elD !== "list-item" &&
    elD !== "flow-root" &&
    elD !== "table-cell"
  )
    return null;
  const d = ps.display;
  if (d === "block" || d === "flex" || d === "grid" || d === "flow-root")
    return spec;
  if (
    d === "inline-block" &&
    (ps.verticalAlign === "baseline" || ps.verticalAlign === "middle")
  ) {
    spec.anchor = "probe";
    return spec;
  }
  return null;
}
function emitPseudoBox(el, which, ps, spec, probeRect, ctx) {
  const elR = domRectToPt(el.getBoundingClientRect(), ctx.containerRect);
  const elS = getComputedStyle(el);
  const bL = pxToPt(elS.borderLeftWidth || "0px"),
    bR = pxToPt(elS.borderRightWidth || "0px");
  const bT = pxToPt(elS.borderTopWidth || "0px"),
    bB = pxToPt(elS.borderBottomWidth || "0px");
  let x, y;
  if (spec.anchor === "abs") {
    const pL = elR.x + bL,
      pT = elR.y + bT;
    const pR = elR.x + elR.w - bR,
      pB = elR.y + elR.h - bB;
    const oL = parseFloat(ps.left),
      oR = parseFloat(ps.right);
    const oT = parseFloat(ps.top),
      oB = parseFloat(ps.bottom);
    x = isFinite(oL)
      ? pL + oL / PX_PER_PT + (spec.mL ?? 0)
      : pR - oR / PX_PER_PT - spec.w - (spec.mR ?? 0);
    y = isFinite(oT)
      ? pT + oT / PX_PER_PT + spec.mT
      : pB - oB / PX_PER_PT - spec.h - spec.mB;
  } else if (spec.anchor === "flow") {
    const cL = elR.x + bL + pxToPt(elS.paddingLeft || "0px");
    const cR = elR.x + elR.w - bR - pxToPt(elS.paddingRight || "0px");
    const cT = elR.y + bT + pxToPt(elS.paddingTop || "0px");
    const cB = elR.y + elR.h - bB - pxToPt(elS.paddingBottom || "0px");
    if (spec.mL === null && spec.mR === null) x = cL + (cR - cL - spec.w) / 2;
    else if (spec.mL === null) x = cR - (spec.mR ?? 0) - spec.w;
    else x = cL + spec.mL;
    y = which === "::before" ? cT + spec.mT : cB - spec.mB - spec.h;
  } else {
    if (!probeRect) return;
    const probeLeft = (probeRect.left - ctx.containerRect.left) / PX_PER_PT;
    const baseline = (probeRect.top - ctx.containerRect.top) / PX_PER_PT;
    x =
      which === "::before"
        ? probeLeft - (spec.mR ?? 0) - spec.w
        : probeLeft + (spec.mL ?? 0);
    if (ps.verticalAlign === "middle") {
      const xh = ((parseFloat(ps.fontSize) || 16) / PX_PER_PT) * 0.5;
      y = baseline - xh / 2 - spec.h / 2;
    } else {
      y = baseline - spec.mB - spec.h;
    }
  }
  x += spec.dx;
  y += spec.dy;
  let gradient = spec.gradient;
  if (gradient) gradient = resolveGradientBox(gradient, spec.w, spec.h);
  const elOp = parseFloat(ps.opacity);
  const base =
    !isNaN(elOp) && elOp < 1
      ? combineOpacity(stackOpacity(ctx), elOp)
      : stackOpacity(ctx);
  for (const { page, y: ly } of paginateSpan(y, spec.h, ctx.pageH)) {
    if (spec.fill || gradient) {
      ctx.commands.push({
        type: "rect",
        page,
        x,
        y: ly,
        w: spec.w,
        h: spec.h,
        fill: gradient ? null : spec.fill,
        gradient,
        radius: spec.radius,
        opacity: gradient ? base : combineOpacity(base, spec.fillAlpha),
      });
    }
    if (spec.border) {
      ctx.commands.push({
        type: "rect",
        page,
        x,
        y: ly,
        w: spec.w,
        h: spec.h,
        fill: null,
        stroke: spec.border.color,
        strokeWidth: spec.border.w,
        radius: spec.radius,
        opacity: combineOpacity(base, spec.border.alpha),
      });
    }
  }
}
async function capturePseudo(el, which, ctx) {
  const ps = getComputedStyle(el, which);
  if (
    ps.display === "none" ||
    !ps.content ||
    ps.content === "none" ||
    ps.content === "normal"
  )
    return;
  if (ps.visibility === "hidden" || ps.visibility === "collapse") return;
  const pseudoCounters = applyCounters(ctx.counters, ps);
  try {
    await capturePseudoContent(el, which, ps, ctx);
  } finally {
    popCounters(ctx.counters, pseudoCounters);
  }
}
async function capturePseudoContent(el, which, ps, ctx) {
  const resolved = resolveContentList(ps.content, ctx.counters);
  if (resolved === null) return;
  const psColorSrc = String(ps.webkitTextFillColor || ps.color);
  const text = applyTextTransform(resolved, ps.textTransform);
  const fontRef =
    text && !isTransparentColor(psColorSrc)
      ? resolveFontRef(
          ps.fontFamily,
          ps.fontWeight,
          ps.fontStyle,
          ctx.fontMap,
          ctx.registeredFonts,
        )
      : null;
  const box = pseudoBoxSpec(el, ps);
  if (!fontRef && !box) return;
  let probeRect = null;
  if (fontRef || box?.anchor === "probe") {
    const probe = document.createElement("span");
    probe.style.cssText =
      "display:inline;font-size:0;line-height:0;vertical-align:baseline;visibility:hidden;pointer-events:none;";
    try {
      if (which === "::before") el.insertBefore(probe, el.firstChild);
      else el.appendChild(probe);
      probeRect = probe.getBoundingClientRect();
    } catch {}
    try {
      el.removeChild(probe);
    } catch {}
  }
  if (box) emitPseudoBox(el, which, ps, box, probeRect, ctx);
  if (!fontRef || !probeRect) return;
  const sizePx = parseFloat(ps.fontSize) || 16;
  const sizePt = sizePx / PX_PER_PT;
  const xPt = (probeRect.left - ctx.containerRect.left) / PX_PER_PT;
  const yPt = (probeRect.top - ctx.containerRect.top) / PX_PER_PT;
  const { page, y: ly } = paginate(yPt, ctx.pageH);
  const { color: colorRgb, alpha: colorAlpha } = splitColorAlpha(
    parseColorAlpha(psColorSrc),
  );
  const color = colorRgb ?? [0, 0, 0];
  const opacity = stackOpacity(ctx);
  const lsPt =
    ps.letterSpacing === "normal" ? void 0 : pxToPt(ps.letterSpacing) || void 0;
  ctx.commands.push({
    type: "text",
    page,
    text,
    x: xPt,
    y: ly,
    font: fontRef.name,
    style: fontRef.style,
    weight: fontRef.weight,
    size: sizePt,
    color,
    align: "left",
    maxWidth: ctx.pageW,
    letterSpacing: lsPt,
    opacity: combineOpacity(opacity, colorAlpha),
  });
}
export {
  captureAnchor,
  capturePseudo,
  captureTextNode,
  captureVerticalTextNode,
  emitBox,
  emitFormField,
  emitLinks,
  emitListMarker,
  resolveGradientBox,
};
