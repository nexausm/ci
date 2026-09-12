// renderer/html/types.ts
import { isMcrRef } from "../types/index.js";
var PX_PER_PT = 96 / 72;
function domRectToPt(r, cRect) {
  return {
    x: (r.left - cRect.left) / PX_PER_PT,
    y: (r.top - cRect.top) / PX_PER_PT,
    w: r.width / PX_PER_PT,
    h: r.height / PX_PER_PT,
  };
}
function paginate(yPt, pageH) {
  const page = Math.max(1, Math.floor(yPt / pageH) + 1);
  return { page, y: yPt - (page - 1) * pageH };
}
function paginateSpan(yPt, h, pageH) {
  const startPage = Math.max(1, Math.floor(yPt / pageH) + 1);
  const endYPt = yPt + h;
  const epsilon = 1e-6;
  const endPage = Math.max(
    startPage,
    Math.floor((endYPt - epsilon) / pageH) + 1,
  );
  const spans = [];
  for (let p = startPage; p <= endPage; p++) {
    spans.push({ page: p, y: yPt - (p - 1) * pageH });
  }
  return spans;
}
function stackOpacity(ctx) {
  if (!ctx.opacityStack.length) return void 0;
  const o = ctx.opacityStack.reduce((a, b) => a * b, 1);
  return o < 1 ? o : void 0;
}
var CSS_TO_PDF_BLEND = {
  multiply: "Multiply",
  screen: "Screen",
  overlay: "Overlay",
  darken: "Darken",
  lighten: "Lighten",
  "color-dodge": "ColorDodge",
  "color-burn": "ColorBurn",
  "hard-light": "HardLight",
  "soft-light": "SoftLight",
  difference: "Difference",
  exclusion: "Exclusion",
  hue: "Hue",
  saturation: "Saturation",
  color: "Color",
  luminosity: "Luminosity",
};
function cssBlendToPdf(v) {
  return v ? CSS_TO_PDF_BLEND[v] : void 0;
}
function stackBlend(ctx) {
  return ctx.blendStack.length
    ? ctx.blendStack[ctx.blendStack.length - 1]
    : void 0;
}
function structTagFor(el, tag) {
  const role = el.getAttribute("role");
  if (role === "presentation" || role === "none") return "Artifact";
  if (el.getAttribute("aria-hidden") === "true") return "Artifact";
  switch (tag) {
    case "H1":
    case "H2":
    case "H3":
    case "H4":
    case "H5":
    case "H6":
      return tag;
    case "P":
      return "P";
    case "UL":
    case "OL":
      return "L";
    case "LI":
      return "LI";
    case "TABLE":
      return "Table";
    case "THEAD":
      return "THead";
    case "TBODY":
      return "TBody";
    case "TFOOT":
      return "TFoot";
    case "TR":
      return "TR";
    case "TD":
      return "TD";
    case "TH":
      return "TH";
    case "IMG":
    case "SVG":
      return "Figure";
    case "A":
      return "Link";
    case "SPAN":
      return "Span";
    default:
      return "Div";
  }
}
function enterStruct(el, tag, ctx) {
  if (!ctx.struct) return void 0;
  const structTag = structTagFor(el, tag);
  if (structTag === "Artifact") {
    ctx.struct.artifactDepth++;
    return "artifact";
  }
  const node = { tag: structTag, kids: [] };
  if (structTag === "Figure") {
    const alt = el.getAttribute("alt");
    if (alt) node.alt = alt;
  }
  const lang = el.lang;
  if (lang) node.lang = lang;
  ctx.struct.stack[ctx.struct.stack.length - 1].kids.push(node);
  ctx.struct.stack.push(node);
  return node;
}
function exitStruct(ctx, entry) {
  if (!ctx.struct || entry === void 0) return;
  if (entry === "artifact") {
    ctx.struct.artifactDepth--;
    return;
  }
  ctx.struct.stack.pop();
  if (entry.kids.length === 0) {
    const parent = ctx.struct.stack[ctx.struct.stack.length - 1];
    const idx = parent.kids.indexOf(entry);
    if (idx >= 0) parent.kids.splice(idx, 1);
  }
}
function tagStructContent(ctx, page) {
  if (!ctx.struct || ctx.struct.artifactDepth > 0) return void 0;
  const parent = ctx.struct.stack[ctx.struct.stack.length - 1];
  const mcid = ctx.struct.mcidCounters.get(page) ?? 0;
  ctx.struct.mcidCounters.set(page, mcid + 1);
  parent.kids.push({ mcid, page });
  return { mcid, tag: parent.tag };
}
function pruneStructTreePages(node, pageCount) {
  node.kids = node.kids.filter((kid) =>
    isMcrRef(kid) ? kid.page <= pageCount : true,
  );
  for (const kid of node.kids) {
    if (!isMcrRef(kid)) pruneStructTreePages(kid, pageCount);
  }
  node.kids = node.kids.filter((kid) => isMcrRef(kid) || kid.kids.length > 0);
}
export {
  PX_PER_PT,
  cssBlendToPdf,
  domRectToPt,
  enterStruct,
  exitStruct,
  paginate,
  paginateSpan,
  pruneStructTreePages,
  stackBlend,
  stackOpacity,
  tagStructContent,
};
