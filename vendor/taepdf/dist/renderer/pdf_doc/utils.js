// renderer/pdf_doc/utils.ts
var _te = new TextEncoder();
function hpf(n) {
  return n.toFixed(3).replace(/\.?0+$/, "");
}
function encodeColor(r, g, b, isStroke, prec = 2) {
  const opG = isStroke ? "G" : "g";
  const opC = isStroke ? "RG" : "rg";
  const fmt = (v) => (v / 255).toFixed(prec).replace(/\.?0+$/, "");
  if (r === g && g === b) return `${fmt(r)} ${opG}`;
  return `${fmt(r)} ${fmt(g)} ${fmt(b)} ${opC}`;
}
function toPdfName(s) {
  let out = "";
  for (const c of s) {
    if (c === "#") {
      out += "#23";
      continue;
    }
    if (" \n\r()[]<>{}/%".includes(c)) {
      out += "#" + c.charCodeAt(0).toString(16).toUpperCase().padStart(2, "0");
      continue;
    }
    out += c;
  }
  return out;
}
function pdfEscape(s) {
  return s.replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
}
function widthsToPdf(widths) {
  let s = "[";
  for (let i = 0; i < widths.length; i++) {
    if (i > 0) s += " ";
    s += `${widths[i][0]} [${widths[i][1]}]`;
  }
  return s + "]";
}
function w2ToPdf(entries) {
  let s = "[";
  for (let i = 0; i < entries.length; i++) {
    if (i > 0) s += " ";
    const [cid, w1y, v1x, v1y] = entries[i];
    s += `${cid} [${w1y} ${v1x} ${v1y}]`;
  }
  return s + "]";
}
function bboxToPdf(bbox) {
  return "[" + bbox.join(" ") + "]";
}
function bytesToHex(bytes) {
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}
function pdfDate() {
  const d = /* @__PURE__ */ new Date();
  const p = (n, w = 2) => n.toString().padStart(w, "0");
  return `D:${d.getUTCFullYear()}${p(d.getUTCMonth() + 1)}${p(d.getUTCDate())}${p(d.getUTCHours())}${p(d.getUTCMinutes())}${p(d.getUTCSeconds())}+00'00'`;
}
export {
  _te,
  bboxToPdf,
  bytesToHex,
  encodeColor,
  hpf,
  pdfDate,
  pdfEscape,
  toPdfName,
  w2ToPdf,
  widthsToPdf,
};
