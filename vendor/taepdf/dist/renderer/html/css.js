// renderer/html/css.ts
import { PX_PER_PT } from "./types.js";
function parseColorAlpha(css, keepZeroAlpha = false) {
  if (!css || css === "transparent") return keepZeroAlpha ? [0, 0, 0, 0] : null;
  const m = css.match(
    /^rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)(?:\s*,\s*([\d.]+))?/,
  );
  if (!m) return namedColor(css);
  const a = m[4] !== void 0 ? Math.round(+m[4] * 255) : 255;
  if (a === 0 && !keepZeroAlpha) return null;
  return [+m[1], +m[2], +m[3], a];
}
var _namedColors = {
  black: [0, 0, 0, 255],
  white: [255, 255, 255, 255],
  red: [255, 0, 0, 255],
  green: [0, 128, 0, 255],
  blue: [0, 0, 255, 255],
  gray: [128, 128, 128, 255],
  grey: [128, 128, 128, 255],
  yellow: [255, 255, 0, 255],
  orange: [255, 165, 0, 255],
  purple: [128, 0, 128, 255],
  pink: [255, 192, 203, 255],
  brown: [165, 42, 42, 255],
  cyan: [0, 255, 255, 255],
  magenta: [255, 0, 255, 255],
  lime: [0, 255, 0, 255],
  navy: [0, 0, 128, 255],
  teal: [0, 128, 128, 255],
  maroon: [128, 0, 0, 255],
  silver: [192, 192, 192, 255],
  indigo: [75, 0, 130, 255],
  violet: [238, 130, 238, 255],
  transparent: [0, 0, 0, 0],
};
function namedColor(name) {
  return _namedColors[name.toLowerCase()] ?? null;
}
function splitByTopLevelComma(s) {
  const parts = [];
  let depth = 0,
    cur = "";
  for (const ch of s) {
    if (ch === "(") depth++;
    else if (ch === ")") depth--;
    if (ch === "," && depth === 0) {
      parts.push(cur.trim());
      cur = "";
    } else cur += ch;
  }
  if (cur.trim()) parts.push(cur.trim());
  return parts;
}
function splitPositionPair(v) {
  return v.trim().split(/\s+(?![^()]*\))/);
}
function parseCSSGradientStops(s) {
  const parts = splitByTopLevelComma(s);
  const stops = [];
  for (let i = 0; i < parts.length; i++) {
    const toks = splitPositionPair(parts[i]);
    const c = parseColorAlpha(toks[0], true);
    if (!c) continue;
    const fallback = i / Math.max(1, parts.length - 1);
    const posToks = toks.slice(1, 3);
    if (!posToks.length) {
      stops.push({ color: c, position: fallback });
      continue;
    }
    for (const tok of posToks) {
      const pctM = tok.match(/^(-?[\d.]+)%$/);
      const pxM = tok.match(/^(-?[\d.]+)px$/);
      if (pctM) stops.push({ color: c, position: +pctM[1] / 100 });
      else if (pxM)
        stops.push({ color: c, position: fallback, posPx: +pxM[1] });
      else stops.push({ color: c, position: fallback });
    }
  }
  return stops;
}
function tileStops(stops, repeating) {
  if (!repeating || stops.length < 2) return stops;
  const pat = stops;
  const s0 = pat[0].position;
  const period = pat[pat.length - 1].position - s0;
  if (period <= 1e-4) return stops;
  const out = [];
  let done = false;
  for (let k = Math.floor(-s0 / period); !done && out.length < 200; k++) {
    for (const st of pat) {
      const p = st.position + k * period;
      out.push({ color: st.color, position: p });
      if (p >= 1) {
        done = true;
        break;
      }
    }
  }
  const firstIdx = Math.max(0, out.findIndex((st) => st.position > 0) - 1);
  return out.slice(firstIdx);
}
function parseCSSGradient(css) {
  const linM = css.match(/^(repeating-)?linear-gradient\((.+)\)$/s);
  if (linM) {
    const repeating = !!linM[1];
    const inner = linM[2].trim();
    let angle = 180;
    let corner;
    let rest = inner;
    const degMatch = inner.match(/^(-?[\d.]+)deg\s*,\s*/);
    const toMatch = inner.match(
      /^to\s+(top|bottom|left|right)(?:\s+(top|bottom|left|right))?\s*,\s*/,
    );
    if (degMatch) {
      angle = +degMatch[1];
      rest = inner.slice(degMatch[0].length);
    } else if (toMatch) {
      const words = [toMatch[1], toMatch[2]].filter(Boolean);
      const vert = words.find((kw) => kw === "top" || kw === "bottom");
      const horiz = words.find((kw) => kw === "left" || kw === "right");
      if (vert && horiz) {
        corner = `${vert} ${horiz}`;
        angle = {
          "top right": 45,
          "bottom right": 135,
          "bottom left": 225,
          "top left": 315,
        }[corner];
      } else {
        angle = { bottom: 180, top: 0, right: 90, left: 270 }[words[0]] ?? 180;
      }
      rest = inner.slice(toMatch[0].length);
    }
    const stops = parseCSSGradientStops(rest);
    if (stops.length >= 2)
      return {
        type: "linear",
        angle,
        corner,
        repeating: repeating || void 0,
        stops,
      };
  }
  const radM = css.match(/^(repeating-)?radial-gradient\((.+)\)$/s);
  if (radM) {
    const repeating = !!radM[1];
    const inner = radM[2].trim();
    let cx = 0.5,
      cy = 0.5,
      rest = inner;
    const atPos = inner.match(/^[^,]*\bat\s+([\d.]+%?)\s+([\d.]+%?)\s*,\s*/);
    if (atPos) {
      cx = parseFloat(atPos[1]) / (atPos[1].endsWith("%") ? 100 : 1);
      cy = parseFloat(atPos[2]) / (atPos[2].endsWith("%") ? 100 : 1);
      rest = inner.slice(atPos[0].length);
    } else {
      const shapeTok =
        /circle|ellipse|closest-side|closest-corner|farthest-side|farthest-corner|[\d.]+(?:px|%)/;
      const shapeM = new RegExp(
        `^(?:${shapeTok.source})(?:\\s+(?:${shapeTok.source}))*\\s*,\\s*`,
      ).exec(inner);
      if (shapeM) rest = inner.slice(shapeM[0].length);
    }
    const stops = parseCSSGradientStops(rest);
    if (stops.length >= 2)
      return { type: "radial", cx, cy, repeating: repeating || void 0, stops };
  }
  return null;
}
function parseCSSConicGradient(css) {
  const m = css.match(/^(repeating-)?conic-gradient\((.+)\)$/s);
  if (!m) return null;
  const repeating = !!m[1];
  let inner = m[2].trim();
  let fromDeg = 0,
    cx = 0.5,
    cy = 0.5;
  const pre = inner.match(
    /^(?:from\s+(-?[\d.]+)deg\s*)?(?:at\s+([\d.]+)%\s+([\d.]+)%\s*)?,\s*/,
  );
  if (pre && (pre[1] !== void 0 || pre[2] !== void 0)) {
    if (pre[1] !== void 0) fromDeg = +pre[1];
    if (pre[2] !== void 0) {
      cx = +pre[2] / 100;
      cy = +pre[3] / 100;
    }
    inner = inner.slice(pre[0].length);
  }
  const parts = splitByTopLevelComma(inner);
  const stops = [];
  for (let i = 0; i < parts.length; i++) {
    const toks = splitPositionPair(parts[i]);
    const c = parseColorAlpha(toks[0], true);
    if (!c) continue;
    const fallback = i / Math.max(1, parts.length - 1);
    const posToks = toks.slice(1, 3);
    if (!posToks.length) {
      stops.push({ color: c, position: fallback });
      continue;
    }
    for (const tok of posToks) {
      const degM = tok.match(/^(-?[\d.]+)deg$/);
      const pctM = tok.match(/^(-?[\d.]+)%$/);
      if (degM) stops.push({ color: c, position: +degM[1] / 360 });
      else if (pctM) stops.push({ color: c, position: +pctM[1] / 100 });
      else stops.push({ color: c, position: fallback });
    }
  }
  if (stops.length < 2) return null;
  return { fromDeg, cx, cy, repeating: repeating || void 0, stops };
}
function parseCSSBoxShadow(css) {
  if (!css || css === "none") return [];
  const shadows = [];
  for (const part of splitByTopLevelComma(css)) {
    const tokens = part.trim().split(/\s+/);
    let inset = false;
    const lengths = [];
    const colorTokens = [];
    for (const tok of tokens) {
      if (tok === "inset") {
        inset = true;
        continue;
      }
      const pxM = tok.match(/^-?[\d.]+px$/);
      if (pxM) {
        lengths.push(parseFloat(tok) / PX_PER_PT);
        continue;
      }
      colorTokens.push(tok);
    }
    const colorStr = colorTokens.join(" ");
    const color = parseColorAlpha(colorStr) ?? [0, 0, 0, 180];
    if (lengths.length >= 2) {
      shadows.push({
        x: lengths[0],
        y: lengths[1],
        blur: lengths[2] ?? 0,
        spread: lengths[3],
        color,
        inset,
      });
    }
  }
  return shadows;
}
function radiusComponent(str, ref) {
  const pxM = str.match(/^(-?[\d.]+)px$/);
  if (pxM) return Math.max(0, +pxM[1] / PX_PER_PT);
  const ptM = str.match(/^(-?[\d.]+)pt$/);
  if (ptM) return Math.max(0, +ptM[1]);
  const pctM = str.match(/^(-?[\d.]+)%$/);
  if (pctM) return Math.max(0, (+pctM[1] / 100) * ref);
  return 0;
}
function overlapScale(tl, tr, br, bl, w, h) {
  return Math.min(
    1,
    ...[
      [w, tl.h + tr.h],
      [w, bl.h + br.h],
      [h, tl.v + bl.v],
      [h, tr.v + br.v],
    ]
      .filter(([, sum]) => sum > 0)
      .map(([limit, sum]) => limit / sum),
  );
}
function parseBorderRadius(s, el, dims) {
  const rect = el?.getBoundingClientRect();
  const elW = rect ? rect.width / PX_PER_PT : (dims?.w ?? 0);
  const elH = rect ? rect.height / PX_PER_PT : (dims?.h ?? 0);
  const parseCorner = (val) => {
    const parts = val.trim().split(/\s+/);
    const hStr = parts[0] ?? val;
    const vStr = parts[1] ?? hStr;
    return { h: radiusComponent(hStr, elW), v: radiusComponent(vStr, elH) };
  };
  const tl = parseCorner(s.borderTopLeftRadius);
  const tr = parseCorner(s.borderTopRightRadius);
  const br = parseCorner(s.borderBottomRightRadius);
  const bl = parseCorner(s.borderBottomLeftRadius);
  if (elW > 0 && elH > 0) {
    const f = overlapScale(tl, tr, br, bl, elW, elH);
    if (f < 1) {
      for (const c of [tl, tr, br, bl]) {
        c.h *= f;
        c.v *= f;
      }
    }
  }
  const corners = [tl, tr, br, bl];
  if (corners.every((c) => c.h === 0 && c.v === 0)) return void 0;
  if (corners.every((c) => c.h === tl.h && c.v === tl.h)) return { all: tl.h };
  return { topLeft: tl, topRight: tr, bottomRight: br, bottomLeft: bl };
}
function clampRadiusToBox(radius, w, h) {
  if (!radius || w <= 0 || h <= 0) return radius;
  const a = radius.all ?? 0;
  const c = (x) => (x ? { h: x.h, v: x.v } : { h: a, v: a });
  const tl = c(radius.topLeft),
    tr = c(radius.topRight);
  const br = c(radius.bottomRight),
    bl = c(radius.bottomLeft);
  const f = overlapScale(tl, tr, br, bl, w, h);
  if (f >= 1) return radius;
  for (const corner of [tl, tr, br, bl]) {
    corner.h *= f;
    corner.v *= f;
  }
  return { topLeft: tl, topRight: tr, bottomRight: br, bottomLeft: bl };
}
function insetBorderRadius(radius, iT, iR, iB, iL) {
  if (!radius) return void 0;
  const a = radius.all ?? 0;
  const inset = (c, ih, iv) => {
    const base = c ?? { h: a, v: a };
    return { h: Math.max(0, base.h - ih), v: Math.max(0, base.v - iv) };
  };
  const tl = inset(radius.topLeft, iL, iT);
  const tr = inset(radius.topRight, iR, iT);
  const br = inset(radius.bottomRight, iR, iB);
  const bl = inset(radius.bottomLeft, iL, iB);
  if ([tl, tr, br, bl].every((c) => c.h <= 0 || c.v <= 0)) return void 0;
  return { topLeft: tl, topRight: tr, bottomRight: br, bottomLeft: bl };
}
function isTransparentColor(css) {
  if (css === "transparent") return true;
  const m = css.match(/^rgba\([^)]*,\s*([\d.]+)\s*\)$/);
  return !!m && parseFloat(m[1]) === 0;
}
function pxToPt(s) {
  const m = s.match(/^(-?[\d.]+)px$/);
  return m ? +m[1] / PX_PER_PT : 0;
}
export {
  clampRadiusToBox,
  insetBorderRadius,
  isTransparentColor,
  parseBorderRadius,
  parseCSSBoxShadow,
  parseCSSConicGradient,
  parseCSSGradient,
  parseColorAlpha,
  pxToPt,
  splitByTopLevelComma,
  splitPositionPair,
  tileStops,
};
