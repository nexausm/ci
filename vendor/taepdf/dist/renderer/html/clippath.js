// renderer/html/clippath.ts
import { PX_PER_PT } from "./types.js";
import { splitByTopLevelComma } from "./css.js";
var RADIUS_TOK =
  "(closest-side|farthest-side|closest-corner|farthest-corner|[\\d.]+(?:px|%))";
function lengthPct(tok, ref) {
  const pxM = tok.match(/^(-?[\d.]+)px$/);
  if (pxM) return +pxM[1] / PX_PER_PT;
  const pctM = tok.match(/^(-?[\d.]+)%$/);
  if (pctM) return (+pctM[1] / 100) * ref;
  return 0;
}
function circleKeywordRadius(kw, cx, cy, w, h) {
  const sides = [cx, w - cx, cy, h - cy];
  const corners = [
    Math.hypot(cx, cy),
    Math.hypot(w - cx, cy),
    Math.hypot(cx, h - cy),
    Math.hypot(w - cx, h - cy),
  ];
  if (kw === "closest-side") return Math.min(...sides);
  if (kw === "farthest-side") return Math.max(...sides);
  if (kw === "closest-corner") return Math.min(...corners);
  return Math.max(...corners);
}
function ellipseAxisRadius(kw, centerAlongAxis, extent) {
  const near = centerAlongAxis,
    far = extent - centerAlongAxis;
  if (kw === "closest-side" || kw === "closest-corner")
    return Math.min(near, far);
  return Math.max(near, far);
}
function resolvePosition(atClause, w, h) {
  if (!atClause) return { cx: w / 2, cy: h / 2 };
  const [xTok, yTok] = atClause.trim().split(/\s+/);
  return { cx: lengthPct(xTok, w), cy: lengthPct(yTok, h) };
}
function parseInset(inner, w, h) {
  const roundM = inner.match(/^(.*?)(?:\s+round\s+(.+))?$/s);
  const sideStr = (roundM?.[1] ?? inner).trim();
  const roundStr = roundM?.[2]?.trim();
  const toks = sideStr.split(/\s+/).filter(Boolean);
  if (!toks.length || toks.length > 4) return null;
  const top = lengthPct(toks[0], h);
  const right = lengthPct(toks[1] ?? toks[0], w);
  const bottom = lengthPct(toks[2] ?? toks[0], h);
  const left = lengthPct(toks[3] ?? toks[1] ?? toks[0], w);
  const x = left,
    y = top;
  const rw = Math.max(0, w - left - right);
  const rh = Math.max(0, h - top - bottom);
  let radius;
  if (roundStr) {
    const [hPart, vPart] = roundStr.split("/").map((s) => s.trim());
    const hToks = hPart.split(/\s+/);
    const vToks = (vPart ?? hPart).split(/\s+/);
    const at = (arr, i) => arr[i] ?? arr[(i + 2) % arr.length] ?? arr[0];
    const corner = (i) => ({
      h: lengthPct(at(hToks, i), rw),
      v: lengthPct(at(vToks, i), rh),
    });
    radius = {
      topLeft: corner(0),
      topRight: corner(1),
      bottomRight: corner(2),
      bottomLeft: corner(3),
    };
  }
  return { kind: "rect", x, y, w: rw, h: rh, radius };
}
function parseCircle(inner, w, h) {
  const re = new RegExp(`^\\s*(?:${RADIUS_TOK}\\s*)?(?:at\\s+(.+))?\\s*$`);
  const m = re.exec(inner);
  if (!m) return null;
  const { cx, cy } = resolvePosition(m[2], w, h);
  const radTok = m[1];
  const r = !radTok
    ? circleKeywordRadius("closest-side", cx, cy, w, h)
    : /px$|%$/.test(radTok)
      ? lengthPct(radTok, Math.sqrt((w * w + h * h) / 2))
      : circleKeywordRadius(radTok, cx, cy, w, h);
  return {
    kind: "rect",
    x: cx - r,
    y: cy - r,
    w: r * 2,
    h: r * 2,
    radius: { all: r },
  };
}
function parseEllipse(inner, w, h) {
  const re = new RegExp(
    `^\\s*(?:${RADIUS_TOK}\\s+${RADIUS_TOK}\\s*)?(?:at\\s+(.+))?\\s*$`,
  );
  const m = re.exec(inner);
  if (!m) return null;
  const { cx, cy } = resolvePosition(m[3], w, h);
  const rxTok = m[1],
    ryTok = m[2];
  const rx = !rxTok
    ? ellipseAxisRadius("closest-side", cx, w)
    : /px$|%$/.test(rxTok)
      ? lengthPct(rxTok, w)
      : ellipseAxisRadius(rxTok, cx, w);
  const ry = !ryTok
    ? ellipseAxisRadius("closest-side", cy, h)
    : /px$|%$/.test(ryTok)
      ? lengthPct(ryTok, h)
      : ellipseAxisRadius(ryTok, cy, h);
  const corner = { h: rx, v: ry };
  return {
    kind: "rect",
    x: cx - rx,
    y: cy - ry,
    w: rx * 2,
    h: ry * 2,
    radius: {
      topLeft: corner,
      topRight: corner,
      bottomRight: corner,
      bottomLeft: corner,
    },
  };
}
function parsePolygon(inner, w, h) {
  let rest = inner.trim();
  let evenOdd = false;
  const ruleM = rest.match(/^(nonzero|evenodd)\s*,\s*/);
  if (ruleM) {
    evenOdd = ruleM[1] === "evenodd";
    rest = rest.slice(ruleM[0].length);
  }
  const points = splitByTopLevelComma(rest).map((pair) => {
    const [xTok, yTok] = pair.trim().split(/\s+/);
    return [lengthPct(xTok, w), lengthPct(yTok, h)];
  });
  if (points.length < 3) return null;
  const ops = [{ op: "m", args: points[0] }];
  for (let i = 1; i < points.length; i++)
    ops.push({ op: "l", args: points[i] });
  return { kind: "path", ops, evenOdd };
}
function tokenizePathNumbers(s) {
  return (s.match(/-?\d*\.?\d+(?:[eE][-+]?\d+)?/g) ?? []).map(Number);
}
function tokenizeArcArgs(s) {
  const out = [];
  let i = 0;
  const numRe = /-?\d*\.?\d+(?:[eE][-+]?\d+)?/y;
  const skipSep = () => {
    while (i < s.length && /[\s,]/.test(s[i])) i++;
  };
  const readNumber = () => {
    skipSep();
    numRe.lastIndex = i;
    const m = numRe.exec(s);
    if (!m) return void 0;
    i = numRe.lastIndex;
    return Number(m[0]);
  };
  const readFlag = () => {
    skipSep();
    const c = s[i];
    if (c !== "0" && c !== "1") return void 0;
    i++;
    return Number(c);
  };
  for (;;) {
    const rx = readNumber();
    if (rx === void 0) break;
    const ry = readNumber();
    if (ry === void 0) break;
    const rot = readNumber();
    if (rot === void 0) break;
    const laf = readFlag();
    if (laf === void 0) break;
    const sf = readFlag();
    if (sf === void 0) break;
    const x = readNumber();
    if (x === void 0) break;
    const y = readNumber();
    if (y === void 0) break;
    out.push(rx, ry, rot, laf, sf, x, y);
  }
  return out;
}
function quadToCubic(x0, y0, qx, qy, x, y) {
  return [
    x0 + (2 / 3) * (qx - x0),
    y0 + (2 / 3) * (qy - y0),
    x + (2 / 3) * (qx - x),
    y + (2 / 3) * (qy - y),
    x,
    y,
  ];
}
function arcToCubics(x0, y0, rx, ry, phiDeg, largeArc, sweep, x, y) {
  if (rx === 0 || ry === 0)
    return [
      [
        x0 + (x - x0) / 3,
        y0 + (y - y0) / 3,
        x0 + (2 * (x - x0)) / 3,
        y0 + (2 * (y - y0)) / 3,
        x,
        y,
      ],
    ];
  rx = Math.abs(rx);
  ry = Math.abs(ry);
  const phi = (phiDeg * Math.PI) / 180;
  const cosP = Math.cos(phi),
    sinP = Math.sin(phi);
  const dx2 = (x0 - x) / 2,
    dy2 = (y0 - y) / 2;
  const x1p = cosP * dx2 + sinP * dy2;
  const y1p = -sinP * dx2 + cosP * dy2;
  const lambda = (x1p * x1p) / (rx * rx) + (y1p * y1p) / (ry * ry);
  if (lambda > 1) {
    const s = Math.sqrt(lambda);
    rx *= s;
    ry *= s;
  }
  const sign = largeArc === sweep ? -1 : 1;
  const num = rx * rx * ry * ry - rx * rx * y1p * y1p - ry * ry * x1p * x1p;
  const den = rx * rx * y1p * y1p + ry * ry * x1p * x1p;
  const co = sign * Math.sqrt(Math.max(0, num) / (den || 1e-9));
  const cxp = co * ((rx * y1p) / ry);
  const cyp = co * -((ry * x1p) / rx);
  const cx = cosP * cxp - sinP * cyp + (x0 + x) / 2;
  const cy = sinP * cxp + cosP * cyp + (y0 + y) / 2;
  const angle = (ux, uy, vx, vy) => {
    const dot = ux * vx + uy * vy;
    const len = Math.hypot(ux, uy) * Math.hypot(vx, vy);
    const a = Math.acos(Math.min(1, Math.max(-1, dot / (len || 1e-9))));
    return (ux * vy - uy * vx < 0 ? -1 : 1) * a;
  };
  const theta1 = angle(1, 0, (x1p - cxp) / rx, (y1p - cyp) / ry);
  let dtheta = angle(
    (x1p - cxp) / rx,
    (y1p - cyp) / ry,
    (-x1p - cxp) / rx,
    (-y1p - cyp) / ry,
  );
  if (!sweep && dtheta > 0) dtheta -= 2 * Math.PI;
  if (sweep && dtheta < 0) dtheta += 2 * Math.PI;
  const segments = Math.max(1, Math.ceil(Math.abs(dtheta) / (Math.PI / 2)));
  const delta = dtheta / segments;
  const out = [];
  for (let i = 0; i < segments; i++) {
    const a1 = theta1 + i * delta,
      a2 = a1 + delta;
    const k = (4 / 3) * Math.tan(delta / 4);
    const p0 = [Math.cos(a1), Math.sin(a1)];
    const p3 = [Math.cos(a2), Math.sin(a2)];
    const p1 = [p0[0] - k * Math.sin(a1), p0[1] + k * Math.cos(a1)];
    const p2 = [p3[0] + k * Math.sin(a2), p3[1] - k * Math.cos(a2)];
    const tf = (px, py) => [
      cx + cosP * rx * px - sinP * ry * py,
      cy + sinP * rx * px + cosP * ry * py,
    ];
    const [x1, y1] = tf(p1[0], p1[1]);
    const [x2, y2] = tf(p2[0], p2[1]);
    const [x3, y3] = tf(p3[0], p3[1]);
    out.push([x1, y1, x2, y2, x3, y3]);
  }
  return out;
}
function parseSvgPath(d) {
  const ops = [];
  let i = 0,
    cx = 0,
    cy = 0,
    startX = 0,
    startY = 0;
  let lastCubicCtrl = null;
  let lastQuadCtrl = null;
  const cmdRe = /([MLHVCSQTAZmlhvcsqtaz])([^MLHVCSQTAZmlhvcsqtaz]*)/g;
  let m;
  while ((m = cmdRe.exec(d)) !== null) {
    const cmd = m[1];
    const rel = cmd === cmd.toLowerCase();
    const C = cmd.toUpperCase();
    const args = C === "A" ? tokenizeArcArgs(m[2]) : tokenizePathNumbers(m[2]);
    let ai = 0;
    const next = () => args[ai++];
    const emitLine = (x, y) => {
      ops.push({ op: "l", args: [x, y] });
      cx = x;
      cy = y;
    };
    const emitCubic = (x1, y1, x2, y2, x3, y3) => {
      ops.push({ op: "c", args: [x1, y1, x2, y2, x3, y3] });
      cx = x3;
      cy = y3;
    };
    do {
      if (C === "M") {
        const x = next(),
          y = next();
        if (x === void 0) break;
        cx = rel ? cx + x : x;
        cy = rel ? cy + y : y;
        startX = cx;
        startY = cy;
        ops.push({ op: "m", args: [cx, cy] });
        while (args[ai] !== void 0) {
          const lx = next(),
            ly = next();
          emitLine(rel ? cx + lx : lx, rel ? cy + ly : ly);
        }
      } else if (C === "L") {
        const x = next(),
          y = next();
        if (x === void 0) break;
        emitLine(rel ? cx + x : x, rel ? cy + y : y);
      } else if (C === "H") {
        const x = next();
        if (x === void 0) break;
        emitLine(rel ? cx + x : x, cy);
      } else if (C === "V") {
        const y = next();
        if (y === void 0) break;
        emitLine(cx, rel ? cy + y : y);
      } else if (C === "C") {
        const x1 = next(),
          y1 = next(),
          x2 = next(),
          y2 = next(),
          x = next(),
          y = next();
        if (x === void 0) break;
        const X1 = rel ? cx + x1 : x1,
          Y1 = rel ? cy + y1 : y1;
        const X2 = rel ? cx + x2 : x2,
          Y2 = rel ? cy + y2 : y2;
        const X = rel ? cx + x : x,
          Y = rel ? cy + y : y;
        lastCubicCtrl = [X2, Y2];
        lastQuadCtrl = null;
        emitCubic(X1, Y1, X2, Y2, X, Y);
      } else if (C === "S") {
        const x2 = next(),
          y2 = next(),
          x = next(),
          y = next();
        if (x === void 0) break;
        const X2 = rel ? cx + x2 : x2,
          Y2 = rel ? cy + y2 : y2;
        const X = rel ? cx + x : x,
          Y = rel ? cy + y : y;
        const rx1 = lastCubicCtrl ? 2 * cx - lastCubicCtrl[0] : cx;
        const ry1 = lastCubicCtrl ? 2 * cy - lastCubicCtrl[1] : cy;
        lastCubicCtrl = [X2, Y2];
        lastQuadCtrl = null;
        emitCubic(rx1, ry1, X2, Y2, X, Y);
      } else if (C === "Q") {
        const qx = next(),
          qy = next(),
          x = next(),
          y = next();
        if (x === void 0) break;
        const QX = rel ? cx + qx : qx,
          QY = rel ? cy + qy : qy;
        const X = rel ? cx + x : x,
          Y = rel ? cy + y : y;
        lastQuadCtrl = [QX, QY];
        lastCubicCtrl = null;
        emitCubic(...quadToCubic(cx, cy, QX, QY, X, Y));
      } else if (C === "T") {
        const x = next(),
          y = next();
        if (x === void 0) break;
        const X = rel ? cx + x : x,
          Y = rel ? cy + y : y;
        const tqx = lastQuadCtrl ? 2 * cx - lastQuadCtrl[0] : cx;
        const tqy = lastQuadCtrl ? 2 * cy - lastQuadCtrl[1] : cy;
        lastQuadCtrl = [tqx, tqy];
        lastCubicCtrl = null;
        emitCubic(...quadToCubic(cx, cy, tqx, tqy, X, Y));
      } else if (C === "A") {
        const rx = next(),
          ry = next(),
          rot = next(),
          laf = next(),
          sf = next(),
          x = next(),
          y = next();
        if (x === void 0) break;
        const X = rel ? cx + x : x,
          Y = rel ? cy + y : y;
        const x0 = cx,
          y0 = cy;
        for (const seg of arcToCubics(x0, y0, rx, ry, rot, !!laf, !!sf, X, Y)) {
          ops.push({ op: "c", args: seg });
        }
        cx = X;
        cy = Y;
        lastCubicCtrl = null;
        lastQuadCtrl = null;
      } else if (C === "Z") {
        ops.push({ op: "l", args: [startX, startY] });
        cx = startX;
        cy = startY;
        lastCubicCtrl = null;
        lastQuadCtrl = null;
        break;
      }
    } while (C === "M" ? false : args[ai] !== void 0 && C !== "Z");
  }
  return ops;
}
function parsePathFn(inner) {
  let rest = inner.trim();
  let evenOdd = false;
  const ruleM = rest.match(/^(nonzero|evenodd)\s*,\s*/);
  if (ruleM) {
    evenOdd = ruleM[1] === "evenodd";
    rest = rest.slice(ruleM[0].length);
  }
  const strM =
    rest.match(/^"((?:[^"\\]|\\.)*)"$/) ?? rest.match(/^'((?:[^'\\]|\\.)*)'$/);
  if (!strM) return null;
  const ops = parseSvgPath(strM[1].replace(/\\(.)/g, "$1"));
  if (!ops.length) return null;
  const toPt = (seg) => ({
    op: seg.op,
    args: seg.args.map((v) => v / PX_PER_PT),
  });
  return { kind: "path", ops: ops.map(toPt), evenOdd };
}
function parseClipPath(value, box) {
  const v = value.trim();
  if (!v || v === "none") return null;
  const fnM = v.match(/^(inset|circle|ellipse|polygon|path)\((.+)\)$/s);
  if (!fnM) return null;
  const [, fn, argsRaw] = fnM;
  let shape = null;
  if (fn === "inset") shape = parseInset(argsRaw, box.w, box.h);
  if (fn === "circle") shape = parseCircle(argsRaw, box.w, box.h);
  if (fn === "ellipse") shape = parseEllipse(argsRaw, box.w, box.h);
  if (fn === "polygon") shape = parsePolygon(argsRaw, box.w, box.h);
  if (fn === "path") shape = parsePathFn(argsRaw);
  if (!shape) return null;
  if (shape.kind === "rect")
    return { ...shape, x: shape.x + box.x, y: shape.y + box.y };
  return {
    ...shape,
    ops: shape.ops.map((seg) => ({
      op: seg.op,
      args: offsetArgs(seg.args, box.x, box.y),
    })),
  };
}
function offsetArgs(args, dx, dy) {
  const out = args.slice();
  for (let i = 0; i < out.length; i += 2) {
    out[i] += dx;
    out[i + 1] += dy;
  }
  return out;
}
export { parseClipPath, parseSvgPath };
