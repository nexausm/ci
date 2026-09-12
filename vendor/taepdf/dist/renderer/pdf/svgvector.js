// renderer/pdf/svgvector.ts
import { parseSvgPath } from "../html/clippath.js";
var IDENTITY = [1, 0, 0, 1, 0, 0];
function composeAffine(m2, m1) {
  const [a1, b1, c1, d1, e1, f1] = m1;
  const [a2, b2, c2, d2, e2, f2] = m2;
  return [
    a2 * a1 + c2 * b1,
    b2 * a1 + d2 * b1,
    a2 * c1 + c2 * d1,
    b2 * c1 + d2 * d1,
    a2 * e1 + c2 * f1 + e2,
    b2 * e1 + d2 * f1 + f2,
  ];
}
function transformOps(ops, m) {
  return ops.map((seg) => {
    const args = seg.args;
    const out = new Array(args.length);
    for (let i = 0; i < args.length; i += 2) {
      out[i] = m[0] * args[i] + m[2] * args[i + 1] + m[4];
      out[i + 1] = m[1] * args[i] + m[3] * args[i + 1] + m[5];
    }
    return { op: seg.op, args: out };
  });
}
function parseSvgTransformAttr(attr) {
  let m = IDENTITY;
  const re = /(\w+)\s*\(([^)]*)\)/g;
  let mm;
  while ((mm = re.exec(attr)) !== null) {
    const fn = mm[1];
    const args = mm[2]
      .split(/[\s,]+/)
      .filter(Boolean)
      .map(Number);
    let fm = IDENTITY;
    if (fn === "translate") {
      fm = [1, 0, 0, 1, args[0] ?? 0, args[1] ?? 0];
    } else if (fn === "scale") {
      fm = [args[0] ?? 1, 0, 0, args[1] ?? args[0] ?? 1, 0, 0];
    } else if (fn === "rotate") {
      const rad = ((args[0] ?? 0) * Math.PI) / 180;
      const cos = Math.cos(rad),
        sin = Math.sin(rad);
      const cx = args[1] ?? 0,
        cy = args[2] ?? 0;
      const rot = [cos, sin, -sin, cos, 0, 0];
      fm = composeAffine(
        [1, 0, 0, 1, cx, cy],
        composeAffine(rot, [1, 0, 0, 1, -cx, -cy]),
      );
    }
    if (fn === "skewX")
      fm = [1, 0, Math.tan(((args[0] ?? 0) * Math.PI) / 180), 1, 0, 0];
    if (fn === "skewY")
      fm = [1, Math.tan(((args[0] ?? 0) * Math.PI) / 180), 0, 1, 0, 0];
    if (fn === "matrix")
      fm = [
        args[0] ?? 1,
        args[1] ?? 0,
        args[2] ?? 0,
        args[3] ?? 1,
        args[4] ?? 0,
        args[5] ?? 0,
      ];
    m = composeAffine(m, fm);
  }
  return m;
}
var NAMED = {
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
  none: [0, 0, 0, 0],
  transparent: [0, 0, 0, 0],
};
function parseSvgColor(v, currentColor) {
  if (!v) return null;
  const s = v.trim().toLowerCase();
  if (s === "none") return null;
  if (s === "currentcolor") return currentColor;
  const hex6 = s.match(/^#([0-9a-f]{6})$/);
  if (hex6) {
    const n = parseInt(hex6[1], 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255, 255];
  }
  const hex3 = s.match(/^#([0-9a-f]{3})$/);
  if (hex3) {
    const [r, g, b] = hex3[1];
    return [parseInt(r + r, 16), parseInt(g + g, 16), parseInt(b + b, 16), 255];
  }
  const rgbM = s.match(
    /^rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)(?:\s*,\s*([\d.]+))?\s*\)$/,
  );
  if (rgbM)
    return [
      +rgbM[1],
      +rgbM[2],
      +rgbM[3],
      rgbM[4] !== void 0 ? Math.round(+rgbM[4] * 255) : 255,
    ];
  return NAMED[s] ?? null;
}
function parsePercentOrNum(v, fallback) {
  if (!v) return fallback;
  const s = v.trim();
  if (s.endsWith("%")) return parseFloat(s) / 100;
  const n = parseFloat(s);
  return Number.isNaN(n) ? fallback : n;
}
var BAIL_TAGS = [
  "filter",
  "mask",
  "pattern",
  "clipPath",
  "foreignObject",
  "text",
  "style",
  "image",
  "tspan",
  "textPath",
];
function hasBailFeature(doc) {
  for (const tag of BAIL_TAGS)
    if (doc.getElementsByTagName(tag).length) return true;
  for (const el of Array.from(doc.getElementsByTagName("*"))) {
    for (const attr of ["filter", "mask", "clip-path"]) {
      const v = el.getAttribute(attr);
      if (v && v.trim().startsWith("url(")) return true;
    }
  }
  return false;
}
function applyAffine(m, x, y) {
  return [m[0] * x + m[2] * y + m[4], m[1] * x + m[3] * y + m[5]];
}
function parseGradientDefs(doc, currentColor) {
  const defs = /* @__PURE__ */ new Map();
  for (const tag of ["linearGradient", "radialGradient"]) {
    for (const el of Array.from(doc.getElementsByTagName(tag))) {
      const id = el.getAttribute("id");
      if (!id) continue;
      const stops = [];
      for (const stopEl of Array.from(el.getElementsByTagName("stop"))) {
        const offset = parsePercentOrNum(stopEl.getAttribute("offset"), 0);
        const style = stopEl.getAttribute("style") ?? "";
        const styleColor = style.match(/stop-color\s*:\s*([^;]+)/)?.[1];
        const styleOpacity = style.match(/stop-opacity\s*:\s*([^;]+)/)?.[1];
        const color = parseSvgColor(
          styleColor ?? stopEl.getAttribute("stop-color") ?? "black",
          currentColor,
        ) ?? [0, 0, 0, 255];
        const opacity = parseFloat(
          styleOpacity ?? stopEl.getAttribute("stop-opacity") ?? "1",
        );
        stops.push({
          position: Math.max(0, Math.min(1, offset)),
          color: [color[0], color[1], color[2], Math.round(opacity * 255)],
        });
      }
      if (stops.length < 2) continue;
      const cx = parsePercentOrNum(el.getAttribute("cx"), 0.5);
      const cy = parsePercentOrNum(el.getAttribute("cy"), 0.5);
      defs.set(id, {
        isRadial: tag === "radialGradient",
        cx,
        cy,
        r: parsePercentOrNum(el.getAttribute("r"), 0.5),
        fx: el.hasAttribute("fx")
          ? parsePercentOrNum(el.getAttribute("fx"), cx)
          : cx,
        fy: el.hasAttribute("fy")
          ? parsePercentOrNum(el.getAttribute("fy"), cy)
          : cy,
        x1: parsePercentOrNum(el.getAttribute("x1"), 0),
        y1: parsePercentOrNum(el.getAttribute("y1"), 0),
        x2: parsePercentOrNum(el.getAttribute("x2"), 1),
        y2: parsePercentOrNum(el.getAttribute("y2"), 0),
        stops,
        userSpaceOnUse: el.getAttribute("gradientUnits") === "userSpaceOnUse",
        gradientTransform: el.hasAttribute("gradientTransform")
          ? parseSvgTransformAttr(el.getAttribute("gradientTransform"))
          : IDENTITY,
      });
    }
  }
  return defs;
}
var CAP_MAP = { butt: 0, round: 1, square: 2 };
var JOIN_MAP = { miter: 0, round: 1, bevel: 2 };
function readStyle(el, inherited, currentColor) {
  const style = el.getAttribute("style") ?? "";
  const styleAttr = (name) =>
    style.match(new RegExp(`${name}\\s*:\\s*([^;]+)`))?.[1]?.trim();
  const fillRaw = styleAttr("fill") ?? el.getAttribute("fill");
  const strokeRaw = styleAttr("stroke") ?? el.getAttribute("stroke");
  const swRaw = styleAttr("stroke-width") ?? el.getAttribute("stroke-width");
  const foRaw = styleAttr("fill-opacity") ?? el.getAttribute("fill-opacity");
  const soRaw =
    styleAttr("stroke-opacity") ?? el.getAttribute("stroke-opacity");
  const dashRaw =
    styleAttr("stroke-dasharray") ?? el.getAttribute("stroke-dasharray");
  const capRaw =
    styleAttr("stroke-linecap") ?? el.getAttribute("stroke-linecap");
  const joinRaw =
    styleAttr("stroke-linejoin") ?? el.getAttribute("stroke-linejoin");
  let dash = inherited.dash;
  if (dashRaw !== void 0 && dashRaw !== null) {
    if (dashRaw === "none") dash = null;
    else {
      const nums = dashRaw
        .trim()
        .split(/[\s,]+/)
        .map(Number)
        .filter((n) => !Number.isNaN(n) && n >= 0);
      dash = nums.length ? nums : null;
    }
  }
  return {
    fill:
      fillRaw !== null
        ? fillRaw === "none"
          ? null
          : (parseSvgColor(fillRaw, currentColor) ?? inherited.fill)
        : inherited.fill,
    stroke:
      strokeRaw !== null
        ? strokeRaw === "none"
          ? null
          : (parseSvgColor(strokeRaw, currentColor) ?? inherited.stroke)
        : inherited.stroke,
    strokeWidth:
      swRaw !== void 0 && swRaw !== null
        ? parseFloat(swRaw)
        : inherited.strokeWidth,
    fillOpacity:
      foRaw !== void 0 && foRaw !== null
        ? parseFloat(foRaw)
        : inherited.fillOpacity,
    strokeOpacity:
      soRaw !== void 0 && soRaw !== null
        ? parseFloat(soRaw)
        : inherited.strokeOpacity,
    dash,
    lineCap:
      capRaw != null && CAP_MAP[capRaw] !== void 0
        ? CAP_MAP[capRaw]
        : inherited.lineCap,
    lineJoin:
      joinRaw != null && JOIN_MAP[joinRaw] !== void 0
        ? JOIN_MAP[joinRaw]
        : inherited.lineJoin,
  };
}
function fillUrlRef(el) {
  const style = el.getAttribute("style") ?? "";
  const raw =
    style.match(/fill\s*:\s*url\(([^)]+)\)/)?.[1] ?? el.getAttribute("fill");
  const m = raw?.match(/^url\((.+)\)$/);
  if (!m) return null;
  return m[1].replace(/^["']|["']$/g, "").replace(/^#/, "");
}
function bboxOfOps(ops) {
  let minX = Infinity,
    minY = Infinity,
    maxX = -Infinity,
    maxY = -Infinity;
  for (const seg of ops) {
    for (let i = 0; i < seg.args.length; i += 2) {
      minX = Math.min(minX, seg.args[i]);
      maxX = Math.max(maxX, seg.args[i]);
      minY = Math.min(minY, seg.args[i + 1]);
      maxY = Math.max(maxY, seg.args[i + 1]);
    }
  }
  if (!Number.isFinite(minX)) return { x: 0, y: 0, w: 0, h: 0 };
  return { x: minX, y: minY, w: maxX - minX, h: maxY - minY };
}
function rectPathD(x, y, w, h, rx, ry) {
  if (rx <= 0 || ry <= 0) return `M ${x} ${y} H ${x + w} V ${y + h} H ${x} Z`;
  rx = Math.min(rx, w / 2);
  ry = Math.min(ry, h / 2);
  return `M ${x + rx} ${y} H ${x + w - rx} A ${rx} ${ry} 0 0 1 ${x + w} ${y + ry} V ${y + h - ry} A ${rx} ${ry} 0 0 1 ${x + w - rx} ${y + h} H ${x + rx} A ${rx} ${ry} 0 0 1 ${x} ${y + h - ry} V ${y + ry} A ${rx} ${ry} 0 0 1 ${x + rx} ${y} Z`;
}
function ellipsePathD(cx, cy, rx, ry) {
  return `M ${cx - rx} ${cy} A ${rx} ${ry} 0 1 0 ${cx + rx} ${cy} A ${rx} ${ry} 0 1 0 ${cx - rx} ${cy} Z`;
}
function shapeToOps(el) {
  const tag = el.tagName;
  const num = (name, fallback = 0) =>
    parseFloat(el.getAttribute(name) ?? "") || fallback;
  if (tag === "path") {
    const d = el.getAttribute("d");
    return d ? parseSvgPath(d) : null;
  }
  if (tag === "rect") {
    const w = num("width"),
      h = num("height");
    if (w <= 0 || h <= 0) return null;
    let rx = el.hasAttribute("rx")
      ? num("rx")
      : el.hasAttribute("ry")
        ? num("ry")
        : 0;
    let ry = el.hasAttribute("ry") ? num("ry") : rx;
    return parseSvgPath(rectPathD(num("x"), num("y"), w, h, rx, ry));
  }
  if (tag === "circle") {
    const r = num("r");
    if (r <= 0) return null;
    return parseSvgPath(ellipsePathD(num("cx"), num("cy"), r, r));
  }
  if (tag === "ellipse") {
    const rx = num("rx"),
      ry = num("ry");
    if (rx <= 0 || ry <= 0) return null;
    return parseSvgPath(ellipsePathD(num("cx"), num("cy"), rx, ry));
  }
  if (tag === "line") {
    return [
      { op: "m", args: [num("x1"), num("y1")] },
      { op: "l", args: [num("x2"), num("y2")] },
    ];
  }
  if (tag === "polyline" || tag === "polygon") {
    const pts = (el.getAttribute("points") ?? "")
      .trim()
      .split(/[\s,]+/)
      .map(Number);
    if (pts.length < 4) return null;
    const ops = [{ op: "m", args: [pts[0], pts[1]] }];
    for (let i = 2; i + 1 < pts.length; i += 2)
      ops.push({ op: "l", args: [pts[i], pts[i + 1]] });
    if (tag === "polygon") ops.push({ op: "l", args: [pts[0], pts[1]] });
    return ops;
  }
  return null;
}
var MAX_USE_DEPTH = 12;
var XLINK_NS = "http://www.w3.org/1999/xlink";
function walk(
  el,
  matrix,
  inherited,
  gradientDefs,
  out,
  currentColor,
  useDepth = 0,
) {
  const tag = el.tagName;
  if (tag === "defs") return;
  const local = el.getAttribute("transform");
  const m = local
    ? composeAffine(matrix, parseSvgTransformAttr(local))
    : matrix;
  const style = readStyle(el, inherited, currentColor);
  const elOpacity = parsePercentOrNum(el.getAttribute("opacity"), 1);
  if (tag === "g" || tag === "svg" || tag === "a") {
    for (const child of Array.from(el.children))
      walk(child, m, style, gradientDefs, out, currentColor, useDepth);
    return;
  }
  if (tag === "use") {
    if (useDepth >= MAX_USE_DEPTH) return;
    const href =
      el.getAttributeNS(XLINK_NS, "href") ||
      el.getAttribute("href") ||
      el.getAttribute("xlink:href");
    if (!href || !href.startsWith("#")) return;
    const target = el.ownerDocument.getElementById(href.slice(1));
    if (!target) return;
    const x = parseFloat(el.getAttribute("x") ?? "") || 0;
    const y = parseFloat(el.getAttribute("y") ?? "") || 0;
    const um = x || y ? composeAffine(m, [1, 0, 0, 1, x, y]) : m;
    walk(target, um, style, gradientDefs, out, currentColor, useDepth + 1);
    return;
  }
  const rawOps = shapeToOps(el);
  if (!rawOps || !rawOps.length) return;
  const ops = transformOps(rawOps, m);
  const isLine = tag === "line";
  const fillRef = !isLine ? fillUrlRef(el) : null;
  const shape = {
    ops,
    evenOdd: (el.getAttribute("fill-rule") ?? "") === "evenodd",
    opacity: elOpacity,
  };
  if (fillRef && gradientDefs.has(fillRef)) {
    const g = gradientDefs.get(fillRef);
    if (g.userSpaceOnUse) return;
    const bbox = bboxOfOps(ops);
    const gStops = g.stops.map((s) => ({
      position: s.position,
      color: s.color,
    }));
    if (g.isRadial) {
      const [tcx, tcy] = applyAffine(g.gradientTransform, g.cx, g.cy);
      const [tfx, tfy] = applyAffine(g.gradientTransform, g.fx, g.fy);
      shape.gradient = {
        type: "radial",
        cx: tcx,
        cy: tcy,
        fx: tfx,
        fy: tfy,
        stops: gStops,
      };
    } else {
      const [tx1, ty1] = applyAffine(g.gradientTransform, g.x1, g.y1);
      const [tx2, ty2] = applyAffine(g.gradientTransform, g.x2, g.y2);
      const dx = tx2 - tx1,
        dy = -(ty2 - ty1);
      const angle = (Math.atan2(dx, dy) * 180) / Math.PI;
      shape.gradient = { type: "linear", angle, stops: gStops };
    }
    shape.gradientBox = bbox;
  } else if (!isLine && style.fill) {
    shape.fill = [style.fill[0], style.fill[1], style.fill[2]];
  }
  if (style.stroke) {
    shape.stroke = [style.stroke[0], style.stroke[1], style.stroke[2]];
    const scale = (Math.hypot(m[0], m[1]) + Math.hypot(m[2], m[3])) / 2;
    shape.strokeWidth = style.strokeWidth * scale;
    if (style.dash) shape.dashArray = style.dash.map((n) => n * scale);
    if (style.lineCap) shape.lineCap = style.lineCap;
    if (style.lineJoin) shape.lineJoin = style.lineJoin;
  }
  if (!shape.fill && !shape.gradient && !shape.stroke) return;
  const propOpacity =
    shape.fill || shape.gradient ? style.fillOpacity : style.strokeOpacity;
  shape.opacity = elOpacity * propOpacity;
  out.push(shape);
}
function svgToVectorShapes(
  svgStr,
  boxX,
  boxY,
  boxW,
  boxH,
  currentColor = [0, 0, 0, 255],
) {
  if (boxW <= 0 || boxH <= 0) return null;
  let doc;
  try {
    doc = new DOMParser().parseFromString(svgStr, "image/svg+xml");
  } catch {
    return null;
  }
  if (doc.getElementsByTagName("parsererror").length) return null;
  const root = doc.documentElement;
  if (!root || root.tagName !== "svg") return null;
  if (hasBailFeature(doc)) return null;
  const viewBoxAttr = root.getAttribute("viewBox");
  let vbX = 0,
    vbY = 0,
    vbW,
    vbH;
  if (viewBoxAttr) {
    const parts = viewBoxAttr
      .trim()
      .split(/[\s,]+/)
      .map(Number);
    if (
      parts.length !== 4 ||
      parts.some(Number.isNaN) ||
      parts[2] <= 0 ||
      parts[3] <= 0
    )
      return null;
    [vbX, vbY, vbW, vbH] = parts;
  } else {
    vbW = parseFloat(root.getAttribute("width") ?? "") || boxW;
    vbH = parseFloat(root.getAttribute("height") ?? "") || boxH;
  }
  const parAttr = (
    root.getAttribute("preserveAspectRatio") ?? "xMidYMid meet"
  ).trim();
  const parTokens = parAttr.split(/\s+/);
  const align = parTokens.find((t) => t !== "defer") ?? "xMidYMid";
  let scaleX,
    scaleY,
    tx = 0,
    ty = 0;
  if (align === "none") {
    scaleX = boxW / vbW;
    scaleY = boxH / vbH;
  } else {
    const scale = Math.min(boxW / vbW, boxH / vbH);
    scaleX = scale;
    scaleY = scale;
    const extraX = boxW - vbW * scale;
    const extraY = boxH - vbH * scale;
    if (align.startsWith("xMid")) tx = extraX / 2;
    else if (align.startsWith("xMax")) tx = extraX;
    if (align.endsWith("YMid")) ty = extraY / 2;
    else if (align.endsWith("YMax")) ty = extraY;
  }
  const base = composeAffine(
    [1, 0, 0, 1, boxX + tx, boxY + ty],
    composeAffine([scaleX, 0, 0, scaleY, 0, 0], [1, 0, 0, 1, -vbX, -vbY]),
  );
  const gradientDefs = parseGradientDefs(doc, currentColor);
  const defaultStyle = {
    fill: [0, 0, 0, 255],
    stroke: null,
    strokeWidth: 1,
    fillOpacity: 1,
    strokeOpacity: 1,
    dash: null,
    lineCap: 0,
    lineJoin: 0,
  };
  const rootStyle = readStyle(root, defaultStyle, currentColor);
  const out = [];
  for (const child of Array.from(root.children))
    walk(child, base, rootStyle, gradientDefs, out, currentColor);
  return out;
}
export { svgToVectorShapes };
