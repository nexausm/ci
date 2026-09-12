// renderer/html/canvaspaint.ts
var TRANSPARENT = /* @__PURE__ */ new Set(["rgba(0, 0, 0, 0)", "transparent"]);
function paintBoxDecoration(c, x, y, w, h, cs, dpr) {
  if (w <= 0 || h <= 0) return;
  const radius =
    Math.min(parseFloat(cs.borderTopLeftRadius) || 0, w / 2, h / 2) * dpr;
  c.beginPath();
  if (radius > 0) c.roundRect(x, y, w, h, radius);
  else c.rect(x, y, w, h);
  const bg = cs.backgroundColor;
  if (bg && !TRANSPARENT.has(bg)) {
    c.fillStyle = bg;
    c.fill();
  }
  const bw = parseFloat(cs.borderTopWidth) || 0;
  if (bw > 0 && cs.borderTopStyle !== "none") {
    c.lineWidth = bw * dpr;
    c.strokeStyle = cs.borderTopColor;
    c.stroke();
  }
}
function paintText(c, node, x, y, w, h, cs, dpr) {
  const text = (node.textContent ?? "").replace(/\s+/g, " ").trim();
  if (!text) return;
  c.font = `${cs.fontStyle} ${cs.fontWeight} ${parseFloat(cs.fontSize) * dpr}px ${cs.fontFamily}`;
  c.fillStyle = cs.color;
  c.textBaseline = "middle";
  c.textAlign =
    cs.textAlign === "center"
      ? "center"
      : cs.textAlign === "right"
        ? "right"
        : "left";
  const tx =
    cs.textAlign === "center"
      ? x + w / 2
      : cs.textAlign === "right"
        ? x + w
        : x;
  c.fillText(text, tx, y + h / 2);
}
function paintImage(c, img, x, y, w, h) {
  if (!img.complete || img.naturalWidth === 0) return;
  try {
    c.drawImage(img, x, y, w, h);
  } catch {}
}
function paintNode(node, c, rootRect, dpr) {
  const cs = getComputedStyle(node);
  if (cs.display === "none" || cs.visibility === "hidden") return;
  const r = node.getBoundingClientRect();
  const x = (r.left - rootRect.left) * dpr;
  const y = (r.top - rootRect.top) * dpr;
  const w = r.width * dpr;
  const h = r.height * dpr;
  if (node.tagName === "IMG") {
    paintImage(c, node, x, y, w, h);
    return;
  }
  c.save();
  paintBoxDecoration(c, x, y, w, h, cs, dpr);
  c.restore();
  for (const child of Array.from(node.childNodes)) {
    if (child.nodeType === Node.ELEMENT_NODE)
      paintNode(child, c, rootRect, dpr);
    else if (child.nodeType === Node.TEXT_NODE)
      paintText(c, child, x, y, w, h, cs, dpr);
  }
}
function canvasToPngBytes(canvas) {
  let dataUrl;
  try {
    dataUrl = canvas.toDataURL("image/png");
  } catch {
    return null;
  }
  const comma = dataUrl.indexOf(",");
  if (comma < 0) return null;
  const bin = atob(dataUrl.slice(comma + 1));
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}
export { canvasToPngBytes, paintNode };
