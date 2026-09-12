// renderer/html/filters.ts
import { domRectToPt, paginateSpan, stackOpacity } from "./types.js";
import { paintNode, canvasToPngBytes } from "./canvaspaint.js";
function hasFilter(s) {
  return !!s.filter && s.filter !== "none";
}
function emitFilteredElement(el, s, ctx) {
  const domRect = el.getBoundingClientRect();
  if (domRect.width < 1 || domRect.height < 1) return;
  const { x, y, w, h } = domRectToPt(domRect, ctx.containerRect);
  const dpr = 3;
  const cw = Math.max(1, Math.round(domRect.width * dpr));
  const ch = Math.max(1, Math.round(domRect.height * dpr));
  const source = document.createElement("canvas");
  source.width = cw;
  source.height = ch;
  paintNode(el, source.getContext("2d"), domRect, dpr);
  const filtered = document.createElement("canvas");
  filtered.width = cw;
  filtered.height = ch;
  const fctx = filtered.getContext("2d");
  fctx.filter = s.filter;
  fctx.drawImage(source, 0, 0);
  const src = canvasToPngBytes(filtered);
  if (!src) return;
  const opacity = stackOpacity(ctx);
  for (const { page, y: ly } of paginateSpan(y, h, ctx.pageH)) {
    ctx.commands.push({
      type: "image",
      page,
      src,
      format: "png",
      x,
      y: ly,
      w,
      h,
      opacity,
    });
  }
}
export { emitFilteredElement, hasFilter };
