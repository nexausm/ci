// renderer/html/walk.ts
import {
  domRectToPt,
  paginateSpan,
  cssBlendToPdf,
  PX_PER_PT,
  enterStruct,
  exitStruct,
  tagStructContent,
} from "./types.js";
import {
  parseBorderRadius,
  insetBorderRadius,
  splitByTopLevelComma,
  pxToPt,
} from "./css.js";
import { parseClipPath } from "./clippath.js";
import { applyCounters, popCounters } from "./counters.js";
import { hasBorderImage, emitBorderImage } from "./borderimage.js";
import { parseCSSMatrix, buildPdfTransformMatrix } from "./transform.js";
import { hasFilter, emitFilteredElement } from "./filters.js";
import { hasMask, emitMaskedElement } from "./mask.js";
import {
  emitBox,
  emitListMarker,
  captureTextNode,
  captureVerticalTextNode,
  emitLinks,
  emitFormField,
  captureAnchor,
  capturePseudo,
} from "./emit.js";
import {
  emitImage,
  emitInlineSVG,
  emitCanvas,
  emitBgImage,
  extractBgUrl,
} from "./images.js";
var SKIP_TAGS = /* @__PURE__ */ new Set([
  "SCRIPT",
  "STYLE",
  "NOSCRIPT",
  "META",
  "LINK",
  "HEAD",
  "TITLE",
  "TEMPLATE",
]);
function captureAnyTextNode(node, parent, parentStyle, ctx) {
  if (
    parentStyle.writingMode === "vertical-rl" ||
    parentStyle.writingMode === "vertical-lr"
  ) {
    captureVerticalTextNode(node, parent, parentStyle, ctx);
  } else {
    captureTextNode(node, parent, parentStyle, ctx);
  }
}
function tagTextCommands(ctx, cmds) {
  if (!ctx.struct) return;
  for (const cmd of cmds) {
    if (cmd.type !== "text") continue;
    const tagged = tagStructContent(ctx, cmd.page);
    if (tagged) {
      cmd.mcid = tagged.mcid;
      cmd.structTag = tagged.tag;
    }
  }
}
function tagImageCommands(ctx, cmds) {
  if (!ctx.struct) return;
  for (const cmd of cmds) {
    if (cmd.type !== "image" && cmd.type !== "raw-image") continue;
    const tagged = tagStructContent(ctx, cmd.page);
    if (tagged) {
      const c = cmd;
      c.mcid = tagged.mcid;
      c.structTag = tagged.tag;
    }
  }
}
function paddingBoxClip(x, y, w, h, radius, s) {
  const top = pxToPt(s.borderTopWidth || "0px");
  const right = pxToPt(s.borderRightWidth || "0px");
  const bottom = pxToPt(s.borderBottomWidth || "0px");
  const left = pxToPt(s.borderLeftWidth || "0px");
  if (!top && !right && !bottom && !left) return { x, y, w, h, radius };
  return {
    x: x + left,
    y: y + top,
    w: Math.max(0, w - left - right),
    h: Math.max(0, h - top - bottom),
    radius: insetBorderRadius(radius, top, right, bottom, left),
  };
}
async function walkChildren(parent, parentStyle, ctx) {
  const children = Array.from(parent.childNodes);
  let needsZSort = false;
  for (const child of children) {
    if (child.nodeType !== Node.ELEMENT_NODE) continue;
    if (getComputedStyle(child).position !== "static") {
      needsZSort = true;
      break;
    }
  }
  const childCounters = [];
  if (!needsZSort) {
    for (const child of children) {
      if (child.nodeType === Node.TEXT_NODE) {
        const startIdx = ctx.commands.length;
        captureAnyTextNode(child, parent, parentStyle, ctx);
        tagTextCommands(ctx, ctx.commands.slice(startIdx));
      } else if (child.nodeType === Node.ELEMENT_NODE) {
        childCounters.push(...(await walkElement(child, ctx)));
      }
    }
    popCounters(ctx.counters, childCounters);
    return;
  }
  const layers = [];
  for (const child of children) {
    const subCtx = {
      ...ctx,
      commands: [],
      opacityStack: [...ctx.opacityStack],
      blendStack: [...ctx.blendStack],
    };
    if (child.nodeType === Node.TEXT_NODE) {
      captureAnyTextNode(child, parent, parentStyle, subCtx);
      tagTextCommands(ctx, subCtx.commands);
      layers.push({ z: 0, group: 1, commands: subCtx.commands });
    } else if (child.nodeType === Node.ELEMENT_NODE) {
      const childEl = child;
      const cs = getComputedStyle(childEl);
      const positioned = cs.position !== "static";
      const zRaw = parseInt(cs.zIndex, 10);
      const z = positioned && !isNaN(zRaw) ? zRaw : 0;
      const group = !positioned ? 1 : z < 0 ? 0 : z > 0 ? 3 : 2;
      childCounters.push(...(await walkElement(childEl, subCtx)));
      layers.push({ z, group, commands: subCtx.commands });
    }
  }
  popCounters(ctx.counters, childCounters);
  const ordered = [
    ...layers.filter((l) => l.group === 0).sort((a, b) => a.z - b.z),
    ...layers.filter((l) => l.group === 1),
    ...layers.filter((l) => l.group === 2),
    ...layers.filter((l) => l.group === 3).sort((a, b) => a.z - b.z),
  ];
  for (const layer of ordered) {
    for (const cmd of layer.commands) ctx.commands.push(cmd);
  }
}
async function walkElement(el, ctx) {
  const tag = el.tagName.toUpperCase();
  if (SKIP_TAGS.has(tag)) return [];
  const s = getComputedStyle(el);
  if (s.display === "none") return [];
  const structEntry = enterStruct(el, tag, ctx);
  try {
    if (s.position === "fixed" && ctx.fixedElements) {
      return await captureFixedElement(el, tag, s, ctx);
    }
    if (s.transform && s.transform !== "none") {
      return await captureTransformedElement(el, tag, s, ctx);
    }
    return await walkElementBody(el, tag, s, ctx);
  } finally {
    exitStruct(ctx, structEntry);
  }
}
async function captureFixedElement(el, tag, s, ctx) {
  const subCtx = {
    ...ctx,
    commands: [],
    opacityStack: [...ctx.opacityStack],
    blendStack: [...ctx.blendStack],
  };
  const counters =
    s.transform && s.transform !== "none"
      ? await captureTransformedElement(el, tag, s, subCtx)
      : await walkElementBody(el, tag, s, subCtx);
  ctx.fixedElements.push(subCtx.commands);
  return counters;
}
async function captureTransformedElement(el, tag, s, ctx) {
  const rawMatrix = parseCSSMatrix(s.transform);
  if (!rawMatrix) {
    console.warn(
      "[taepdf] 3D transforms (matrix3d/perspective) are not supported \u2014 element rendered untransformed.",
    );
    return walkElementBody(el, tag, s, ctx);
  }
  const cssMatrix = [
    rawMatrix[0],
    rawMatrix[1],
    rawMatrix[2],
    rawMatrix[3],
    rawMatrix[4] / PX_PER_PT,
    rawMatrix[5] / PX_PER_PT,
  ];
  const htmlEl = el;
  const savedInline = htmlEl.style.transform;
  htmlEl.style.transform = "none";
  const boxRect = el.getBoundingClientRect();
  const { x: boxX, y: boxY } = domRectToPt(boxRect, ctx.containerRect);
  const [oxStr, oyStr] = s.transformOrigin.split(/\s+/);
  const originX = boxX + (parseFloat(oxStr) || 0) / PX_PER_PT;
  const originY = boxY + (parseFloat(oyStr) || 0) / PX_PER_PT;
  const subCtx = {
    ...ctx,
    commands: [],
    opacityStack: [...ctx.opacityStack],
    blendStack: [...ctx.blendStack],
  };
  const counters = await walkElementBody(el, tag, s, subCtx);
  htmlEl.style.transform = savedInline;
  const matrix = buildPdfTransformMatrix(
    cssMatrix,
    originX,
    originY,
    ctx.pageH,
  );
  const pages = [...new Set(subCtx.commands.map((c) => c.page))].sort(
    (a, b) => a - b,
  );
  for (const page of pages)
    ctx.commands.push({ type: "transform-push", page, matrix });
  for (const cmd of subCtx.commands) ctx.commands.push(cmd);
  for (const page of pages) ctx.commands.push({ type: "transform-pop", page });
  return counters;
}
async function walkElementBody(el, tag, s, ctx) {
  const hiddenSelf = s.visibility === "hidden" || s.visibility === "collapse";
  const ownCounters = applyCounters(ctx.counters, s);
  captureAnchor(el, ctx);
  const elOpacity = parseFloat(s.opacity);
  const hasOwnOpacity = !isNaN(elOpacity) && elOpacity < 1;
  if (hasOwnOpacity) ctx.opacityStack.push(elOpacity);
  const ownBlend = cssBlendToPdf(s.mixBlendMode);
  if (ownBlend) ctx.blendStack.push(ownBlend);
  const popStacks = () => {
    if (hasOwnOpacity) ctx.opacityStack.pop();
    if (ownBlend) ctx.blendStack.pop();
  };
  if (hasFilter(s)) {
    if (!hiddenSelf) emitFilteredElement(el, s, ctx);
    popStacks();
    return ownCounters;
  }
  if (hasMask(s)) {
    if (!hiddenSelf) await emitMaskedElement(el, s, ctx);
    popStacks();
    return ownCounters;
  }
  let clipPathSpans = [];
  const clipPathVal = s.clipPath;
  if (clipPathVal && clipPathVal !== "none") {
    const box = domRectToPt(el.getBoundingClientRect(), ctx.containerRect);
    const shape = parseClipPath(clipPathVal, box);
    if (shape?.kind === "rect") {
      const spans = paginateSpan(shape.y, Math.max(shape.h, 1e-3), ctx.pageH);
      for (const { page, y: ly } of spans) {
        ctx.commands.push({
          type: "clip-push",
          page,
          x: shape.x,
          y: ly,
          w: shape.w,
          h: shape.h,
          radius: shape.radius,
        });
      }
      clipPathSpans = spans;
    } else if (shape?.kind === "path") {
      const ys = shape.ops.flatMap((seg) =>
        seg.args.filter((_, i) => i % 2 === 1),
      );
      const minY = Math.min(...ys),
        maxY = Math.max(...ys);
      const spans = paginateSpan(minY, Math.max(maxY - minY, 1e-3), ctx.pageH);
      for (const { page, y: ly } of spans) {
        const dy = ly - minY;
        const ops = shape.ops.map((seg) => ({
          op: seg.op,
          args: seg.args.map((v, i) => (i % 2 === 1 ? v + dy : v)),
        }));
        ctx.commands.push({
          type: "clip-push",
          page,
          path: ops,
          evenOdd: shape.evenOdd,
        });
      }
      clipPathSpans = spans;
    }
  }
  const popClipPath = () => {
    for (const { page } of clipPathSpans)
      ctx.commands.push({ type: "clip-pop", page });
  };
  if (tag === "SVG") {
    if (!hiddenSelf) {
      const startIdx = ctx.commands.length;
      await emitInlineSVG(el, ctx);
      tagImageCommands(ctx, ctx.commands.slice(startIdx));
    }
    popClipPath();
    popStacks();
    return ownCounters;
  }
  if (!hiddenSelf) {
    emitBox(el, s, ctx);
    emitListMarker(el, s, ctx);
    if (hasBorderImage(s)) await emitBorderImage(el, s, ctx);
  }
  const clips = (v) =>
    v === "hidden" || v === "clip" || v === "auto" || v === "scroll";
  const needsClip = clips(s.overflowX) || clips(s.overflowY);
  let clipSpans = [];
  let clipRegion = null;
  if (needsClip) {
    const r = el.getBoundingClientRect();
    const { x, y, w, h } = domRectToPt(r, ctx.containerRect);
    clipRegion = paddingBoxClip(x, y, w, h, parseBorderRadius(s, el), s);
    clipSpans = paginateSpan(
      clipRegion.y,
      Math.max(clipRegion.h, 1e-3),
      ctx.pageH,
    );
    for (const { page, y: ly } of clipSpans) {
      ctx.commands.push({
        type: "clip-push",
        page,
        x: clipRegion.x,
        y: ly,
        w: clipRegion.w,
        h: clipRegion.h,
        radius: clipRegion.radius,
      });
    }
  }
  const popClips = () => {
    for (const { page } of clipSpans) {
      ctx.commands.push({ type: "clip-pop", page });
    }
    popClipPath();
  };
  if (!hiddenSelf && s.backgroundImage && s.backgroundImage !== "none") {
    const layers = splitByTopLevelComma(s.backgroundImage);
    for (let i = layers.length - 1; i >= 0; i--) {
      const url = extractBgUrl(layers[i].trim());
      if (url) await emitBgImage(el, url, ctx, i, layers.length);
    }
  }
  if (tag === "IMG") {
    if (!hiddenSelf) {
      const startIdx = ctx.commands.length;
      await emitImage(el, ctx);
      tagImageCommands(ctx, ctx.commands.slice(startIdx));
    }
    popClips();
    popStacks();
    return ownCounters;
  }
  if (tag === "CANVAS") {
    if (!hiddenSelf) emitCanvas(el, ctx);
    popClips();
    popStacks();
    return ownCounters;
  }
  if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") {
    if (!hiddenSelf) emitFormField(el, s, ctx);
    popClips();
    popStacks();
    return ownCounters;
  }
  if (tag === "A" && !hiddenSelf) emitLinks(el, ctx);
  await capturePseudo(el, "::before", ctx);
  await walkChildren(el, s, ctx);
  await capturePseudo(el, "::after", ctx);
  popClips();
  popStacks();
  return ownCounters;
}
export { walkChildren };
