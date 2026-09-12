// renderer/html/index.ts
import { applyToPDF, rasterizeSVGs } from "../pdf/index.js";
import { resolvePageSize } from "../types/index.js";
import { PX_PER_PT, pruneStructTreePages } from "./types.js";
import { buildRegisteredFontMap } from "./fonts.js";
import { walkChildren } from "./walk.js";
import { emitBox } from "./emit.js";
import {
  parseSafeHTML,
  safeInjectParsed,
  createHiddenContainer,
  autoRegisterFonts,
  waitForLayout,
  injectWordBreaks,
  nextScopeId,
  extractFontFaceBlocks,
} from "./prep.js";
import { applyCounters } from "./counters.js";
import { applyPageBreaks, undoPageBreaks } from "./breaks.js";
import { measureChromeHeight, captureChrome } from "./chrome.js";
import { invalidateFontMapCache } from "./fonts.js";
import { invalidateImageCache } from "./images.js";
async function fromDOM(el, config, fonts = {}, taggedPdf = false) {
  const size = resolvePageSize(config.size, config.orientation);
  await waitForLayout();
  applyPageBreaks(el, size.height * PX_PER_PT);
  try {
    const structRoot = { tag: "Root", kids: [] };
    const ctx = {
      containerRect: el.getBoundingClientRect(),
      pageH: size.height,
      pageW: size.width,
      commands: [],
      anchors: /* @__PURE__ */ new Map(),
      fontMap: fonts,
      registeredFonts: buildRegisteredFontMap(),
      opacityStack: [],
      blendStack: [],
      counters: /* @__PURE__ */ new Map(),
      struct: taggedPdf
        ? {
            root: structRoot,
            stack: [structRoot],
            mcidCounters: /* @__PURE__ */ new Map(),
            artifactDepth: 0,
          }
        : void 0,
      fieldCounter: { n: 0 },
      fixedElements: [],
    };
    const rootStyle = getComputedStyle(el);
    applyCounters(ctx.counters, rootStyle);
    emitBox(el, rootStyle, ctx);
    await walkChildren(el, rootStyle, ctx);
    const totalHPx = el.scrollHeight;
    const rawPages = totalHPx / (size.height * PX_PER_PT);
    const frac = rawPages - Math.floor(rawPages);
    const pageCount = Math.max(
      1,
      frac < 0.01 ? Math.floor(rawPages) : Math.ceil(rawPages),
    );
    const commands = ctx.commands.filter((c) => c.page <= pageCount);
    for (const group of ctx.fixedElements ?? []) {
      if (!group.length) continue;
      const naturalPage = Math.min(...group.map((c) => c.page));
      if (naturalPage > pageCount) continue;
      for (let page = 1; page <= pageCount; page++) {
        for (const cmd of group) {
          if (page === naturalPage) {
            commands.push(cmd);
            continue;
          }
          const clone = { ...cmd, page };
          delete clone.mcid;
          delete clone.structTag;
          commands.push(clone);
        }
      }
    }
    if (taggedPdf) pruneStructTreePages(structRoot, pageCount);
    return {
      commands,
      pageCount,
      anchors: ctx.anchors,
      structRoot: taggedPdf ? structRoot : void 0,
    };
  } finally {
    undoPageBreaks(el);
  }
}
async function fromHTML(
  html,
  config,
  fonts = {},
  chrome = {},
  taggedPdf = false,
) {
  const scopeId = nextScopeId();
  const parsed = parseSafeHTML(html, scopeId);
  const styleText = Array.from(parsed.querySelectorAll("style"))
    .map((s) => s.textContent ?? "")
    .join("\n");
  await autoRegisterFonts(styleText);
  const trueSize = resolvePageSize(config.size, config.orientation);
  const headerH = chrome.header
    ? await measureChromeHeight(chrome.header, trueSize.width)
    : 0;
  const footerH = chrome.footer
    ? await measureChromeHeight(chrome.footer, trueSize.width)
    : 0;
  const contentConfig =
    headerH || footerH
      ? {
          size: {
            width: trueSize.width,
            height: trueSize.height - headerH - footerH,
          },
        }
      : config;
  const contentHeight = resolvePageSize(
    contentConfig.size,
    contentConfig.orientation,
  ).height;
  const container = createHiddenContainer(trueSize.width, contentHeight);
  let capture;
  try {
    safeInjectParsed(parsed, container, scopeId);
    injectWordBreaks(container);
    const opszStyle = document.createElement("style");
    opszStyle.textContent = `[data-tpdf-scope="${scopeId}"] *{font-optical-sizing:none}`;
    container.appendChild(opszStyle);
    capture = await fromDOM(container, contentConfig, fonts, taggedPdf);
  } finally {
    document.body.removeChild(container);
  }
  if (!headerH && !footerH) return capture;
  return applyChrome(capture, chrome, trueSize, headerH, footerH, fonts);
}
async function applyChrome(capture, chrome, trueSize, headerH, footerH, fonts) {
  const pages = Array.from(new Set(capture.commands.map((c) => c.page))).sort(
    (a, b) => a - b,
  );
  const out = [];
  const contentH = trueSize.height - headerH - footerH;
  for (const page of pages) {
    if (headerH)
      out.push({
        type: "transform-push",
        page,
        matrix: [1, 0, 0, 1, 0, -headerH],
      });
    out.push({
      type: "clip-push",
      page,
      x: 0,
      y: 0,
      w: trueSize.width,
      h: contentH,
    });
    for (const cmd of capture.commands) if (cmd.page === page) out.push(cmd);
    out.push({ type: "clip-pop", page });
    if (headerH) out.push({ type: "transform-pop", page });
  }
  for (let page = 1; page <= capture.pageCount; page++) {
    if (chrome.header && headerH > 0) {
      const cmds = await captureChrome(
        chrome.header,
        page,
        capture.pageCount,
        trueSize.width,
        headerH,
        fonts,
      );
      out.push({
        type: "clip-push",
        page,
        x: 0,
        y: 0,
        w: trueSize.width,
        h: headerH,
      });
      for (const c of cmds) {
        c.page = page;
        out.push(c);
      }
      out.push({ type: "clip-pop", page });
    }
    if (chrome.footer && footerH > 0) {
      const cmds = await captureChrome(
        chrome.footer,
        page,
        capture.pageCount,
        trueSize.width,
        footerH,
        fonts,
      );
      out.push({
        type: "transform-push",
        page,
        matrix: [1, 0, 0, 1, 0, -(trueSize.height - footerH)],
      });
      out.push({
        type: "clip-push",
        page,
        x: 0,
        y: 0,
        w: trueSize.width,
        h: footerH,
      });
      for (const c of cmds) {
        c.page = page;
        out.push(c);
      }
      out.push({ type: "clip-pop", page });
      out.push({ type: "transform-pop", page });
    }
  }
  const anchors = /* @__PURE__ */ new Map();
  for (const [id, entry] of capture.anchors) {
    anchors.set(
      id,
      headerH ? { page: entry.page, y: entry.y + headerH } : entry,
    );
  }
  return {
    commands: out,
    pageCount: capture.pageCount,
    anchors,
    structRoot: capture.structRoot,
  };
}
var _injectedPreviewFonts = /* @__PURE__ */ new Set();
var _previewFontStyleEl = null;
function ensurePreviewFontStyleEl() {
  if (!_previewFontStyleEl || !_previewFontStyleEl.isConnected) {
    _previewFontStyleEl = document.createElement("style");
    _previewFontStyleEl.dataset.tpdfPreviewFonts = "";
    document.head.appendChild(_previewFontStyleEl);
  }
  return _previewFontStyleEl;
}
function previewHTML(html, container, config) {
  container.dataset.tpdfPreview = "";
  if (!container.querySelector("[data-tpdf-opsz]")) {
    const opszEl = document.createElement("style");
    opszEl.dataset.tpdfOpsz = "";
    opszEl.textContent =
      "[data-tpdf-preview] *,[data-tpdf-measure] *{font-optical-sizing:none}";
    container.appendChild(opszEl);
  }
  const size = resolvePageSize(config.size, config.orientation);
  const pageWPx = size.width * PX_PER_PT;
  const pageHPx = size.height * PX_PER_PT;
  const scopeId = nextScopeId();
  const parsed = parseSafeHTML(html, scopeId);
  for (const el of Array.from(parsed.querySelectorAll("style"))) {
    const css = el.textContent ?? "";
    const blocks = extractFontFaceBlocks(css);
    let stripped = css;
    for (const block of blocks) {
      if (!_injectedPreviewFonts.has(block)) {
        _injectedPreviewFonts.add(block);
        ensurePreviewFontStyleEl().appendChild(
          document.createTextNode(block + "\n"),
        );
      }
      stripped = stripped.replace(block, "");
    }
    el.textContent = stripped;
  }
  const measure = document.createElement("div");
  measure.dataset.tpdfMeasure = "";
  measure.style.cssText = `position:fixed;top:-99999px;left:-99999px;width:${pageWPx}px;height:auto;visibility:hidden;transform:translateZ(0);`;
  safeInjectParsed(parsed, measure, scopeId);
  document.body.appendChild(measure);
  injectWordBreaks(measure);
  applyPageBreaks(measure, pageHPx);
  const totalHPx = measure.scrollHeight;
  const measured = Array.from(measure.childNodes).map((n) => n.cloneNode(true));
  document.body.removeChild(measure);
  const rawPages = totalHPx / pageHPx;
  const frac = rawPages - Math.floor(rawPages);
  const pageCount = Math.max(
    1,
    frac < 0.01 ? Math.floor(rawPages) : Math.ceil(rawPages),
  );
  const frag = document.createDocumentFragment();
  for (let p = 0; p < pageCount; p++) {
    const page = document.createElement("div");
    page.style.cssText = `position:relative;width:${pageWPx}px;height:${pageHPx}px;overflow:hidden;flex-shrink:0;background:white;box-shadow:0 2px 8px rgba(0,0,0,0.15);transform:translateZ(0);`;
    if (p < pageCount - 1) page.style.marginBottom = "24px";
    const inner = document.createElement("div");
    inner.dataset.tpdfScope = scopeId;
    inner.style.cssText = `position:absolute;top:${-(p * pageHPx)}px;left:0;width:100%;margin:0;`;
    for (const node of measured) inner.appendChild(node.cloneNode(true));
    page.appendChild(inner);
    frag.appendChild(page);
  }
  for (const child of Array.from(container.children)) {
    if (child.tagName !== "STYLE") container.removeChild(child);
  }
  container.appendChild(frag);
}
async function renderHTMLtoPDF(html, config, options = {}, fonts = {}) {
  if (options.pdfA && options.security) {
    throw new Error(
      "[taepdf] PDF/A does not allow encryption \u2014 pass either `pdfA` or `security`, not both.",
    );
  }
  const taggedPdf = !!(options.taggedPdf || options.pdfA);
  const { commands, anchors, structRoot } = await fromHTML(
    html,
    config,
    fonts,
    { header: options.header, footer: options.footer },
    taggedPdf,
  );
  await rasterizeSVGs(commands);
  const shim = {
    config,
    metadata: options.metadata,
    security: options.security,
    bookmarks: options.bookmarks,
    taggedPdf,
    pdfA: !!options.pdfA,
  };
  return applyToPDF(commands, shim, anchors, structRoot);
}
export {
  fromDOM,
  fromHTML,
  invalidateFontMapCache,
  invalidateImageCache,
  previewHTML,
  renderHTMLtoPDF,
};
