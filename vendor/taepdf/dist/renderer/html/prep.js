// renderer/html/prep.ts
import { loadAndRegisterFont } from "../../engine.js";
import { PX_PER_PT } from "./types.js";
import { invalidateFontMapCache } from "./fonts.js";
async function waitForLayout() {
  if (typeof document !== "undefined" && document.fonts?.ready) {
    await document.fonts.ready;
  }
  await new Promise((resolve) =>
    requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
  );
}
function injectWordBreaks(root, chunkSize = 25) {
  const d = root.ownerDocument ?? document;
  const walker = d.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const targets = [];
  let node;
  while ((node = walker.nextNode())) targets.push(node);
  for (const text of targets) {
    const raw = text.textContent ?? "";
    if (!/\S{26,}/.test(raw)) continue;
    const parent = text.parentNode;
    if (!parent) continue;
    if (parent.nodeType === Node.ELEMENT_NODE) {
      const ws = getComputedStyle(parent).whiteSpace;
      if (ws === "nowrap" || ws === "pre") continue;
    }
    const frag = d.createDocumentFragment();
    let last = 0;
    const re = /\S{26,}/g;
    let m;
    while ((m = re.exec(raw)) !== null) {
      if (m.index > last)
        frag.appendChild(d.createTextNode(raw.slice(last, m.index)));
      const word = m[0];
      for (let i = 0; i < word.length; i += chunkSize) {
        frag.appendChild(d.createTextNode(word.slice(i, i + chunkSize)));
        if (i + chunkSize < word.length)
          frag.appendChild(d.createElement("wbr"));
      }
      last = m.index + word.length;
    }
    if (last < raw.length) frag.appendChild(d.createTextNode(raw.slice(last)));
    parent.replaceChild(frag, text);
  }
}
var scopeCounter = 0;
function nextScopeId() {
  scopeCounter += 1;
  return `s${scopeCounter}${Math.random().toString(36).slice(2, 8)}`;
}
function scopeTemplateCSS(css, scopeId) {
  const faces = [];
  const rest = css.replace(/@font-face\s*\{[^}]*\}/g, (m) => {
    faces.push(m);
    return "";
  });
  const body = rest
    .trim()
    .replace(/:root\b/g, ":scope")
    .replace(/(^|[},\s])(html|body)(?=[\s,{.:#[>+~])/g, "$1:scope");
  const scoped = body
    ? `@scope ([data-tpdf-scope="${scopeId}"]) {
${body}
}`
    : "";
  return [faces.join("\n"), scoped].filter(Boolean).join("\n");
}
function parseSafeHTML(html, scopeId) {
  const doc = new DOMParser().parseFromString(html, "text/html");
  doc.querySelectorAll('link[rel="stylesheet"]').forEach((l) => {
    console.warn(
      `[taepdf] <link rel="stylesheet" href="${l.getAttribute("href")}"> is not supported and was removed \u2014 use an inline <style> block instead.`,
    );
  });
  doc
    .querySelectorAll("script, link, object, embed, iframe, video, audio")
    .forEach((s) => s.remove());
  doc.querySelectorAll("style").forEach((s) => {
    const css = s.textContent ?? "";
    for (const imp of css.match(/@import\b[^;]*/g) ?? []) {
      console.warn(
        `[taepdf] "${imp.trim()}" is not supported and was removed \u2014 inline the imported stylesheet's contents instead.`,
      );
    }
    s.textContent = scopeTemplateCSS(
      css.replace(/@import\b[^;]*;?/g, ""),
      scopeId,
    );
  });
  const XLINK_NS = "http://www.w3.org/1999/xlink";
  const isScriptScheme = (v) =>
    !!v && /^\s*(javascript|data|vbscript):/i.test(v);
  doc.querySelectorAll("*").forEach((el) => {
    for (const { name } of Array.from(el.attributes)) {
      if (name.startsWith("on")) el.removeAttribute(name);
    }
    if (isScriptScheme(el.getAttribute("href"))) el.removeAttribute("href");
    if (isScriptScheme(el.getAttributeNS(XLINK_NS, "href")))
      el.removeAttributeNS(XLINK_NS, "href");
    if (isScriptScheme(el.getAttribute("xlink:href")))
      el.removeAttribute("xlink:href");
  });
  return doc;
}
function safeInjectParsed(doc, container, scopeId) {
  container.dataset.tpdfScope = scopeId;
  const frag = document.createDocumentFragment();
  for (const style of Array.from(doc.head.querySelectorAll("style"))) {
    frag.appendChild(document.importNode(style, true));
  }
  for (const node of Array.from(doc.body.childNodes)) {
    frag.appendChild(document.importNode(node, true));
  }
  container.textContent = "";
  container.appendChild(frag);
}
function createHiddenContainer(pageWPt, pageHPt) {
  const div = document.createElement("div");
  const height = pageHPt !== void 0 ? `${pageHPt * PX_PER_PT}px` : "auto";
  div.style.cssText = `position:fixed;top:-99999px;left:-99999px;width:${pageWPt * PX_PER_PT}px;height:${height};overflow:visible;pointer-events:none;z-index:-9999;transform:translateZ(0);`;
  document.body.appendChild(div);
  return div;
}
function extractFontFaceBlocks(css) {
  const blocks = [];
  const startRe = /@font-face\s*\{/g;
  let sm;
  while ((sm = startRe.exec(css)) !== null) {
    let pos = sm.index + sm[0].length;
    let depth = 1;
    let parenDepth = 0;
    let inStr = null;
    while (pos < css.length && depth > 0) {
      const ch = css[pos];
      if (inStr) {
        if (ch === "\\") {
          pos += 2;
          continue;
        }
        if (ch === inStr) inStr = null;
      } else if (parenDepth > 0) {
        if (ch === ")") parenDepth--;
        else if (ch === "(") parenDepth++;
        else if (ch === '"' || ch === "'") inStr = ch;
      } else {
        if (ch === '"' || ch === "'") inStr = ch;
        else if (ch === "(") parenDepth++;
        else if (ch === "{") depth++;
        else if (ch === "}") depth--;
      }
      pos++;
    }
    blocks.push(css.slice(sm.index, pos));
    startRe.lastIndex = pos;
  }
  return blocks;
}
function parseAtFontFace(html) {
  const results = [];
  for (const block of extractFontFaceBlocks(html)) {
    const nameM = block.match(/font-family\s*:\s*['"]?([^'";,]+)['"]?/);
    const urlM = block.match(/src\s*:[^;]*url\(['"]?([^'")\s]+)['"]?\)/);
    if (nameM && urlM)
      results.push({ name: nameM[1].trim(), url: urlM[1].trim() });
  }
  return results;
}
async function autoRegisterFonts(styleText) {
  const faces = parseAtFontFace(styleText);
  if (!faces.length) return;
  await Promise.all(
    faces.map((f) =>
      loadAndRegisterFont({ path: f.url, name: f.name }).catch((e) =>
        console.warn(
          `[taepdf] Could not load font "${f.name}" from ${f.url}:`,
          e,
        ),
      ),
    ),
  );
  invalidateFontMapCache();
}
export {
  autoRegisterFonts,
  createHiddenContainer,
  extractFontFaceBlocks,
  injectWordBreaks,
  nextScopeId,
  parseSafeHTML,
  safeInjectParsed,
  waitForLayout,
};
