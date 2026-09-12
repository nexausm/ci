// renderer/html/chrome.ts
import { PX_PER_PT } from "./types.js";
import { buildRegisteredFontMap } from "./fonts.js";
import { walkChildren } from "./walk.js";
import { emitBox } from "./emit.js";
import {
  parseSafeHTML,
  safeInjectParsed,
  createHiddenContainer,
  autoRegisterFonts,
  injectWordBreaks,
  nextScopeId,
} from "./prep.js";
async function renderChromeInto(fn, page, totalPages, pageWidthPt) {
  const html = fn(page, totalPages);
  const scopeId = nextScopeId();
  const parsed = parseSafeHTML(html, scopeId);
  const styleText = Array.from(parsed.querySelectorAll("style"))
    .map((s) => s.textContent ?? "")
    .join("\n");
  await autoRegisterFonts(styleText);
  const container = createHiddenContainer(pageWidthPt);
  safeInjectParsed(parsed, container, scopeId);
  injectWordBreaks(container);
  return container;
}
async function measureChromeHeight(fn, pageWidthPt) {
  const container = await renderChromeInto(fn, 1, 1, pageWidthPt);
  try {
    return container.scrollHeight / PX_PER_PT;
  } finally {
    document.body.removeChild(container);
  }
}
async function captureChrome(
  fn,
  page,
  totalPages,
  pageWidthPt,
  bandHeightPt,
  fonts,
) {
  const container = await renderChromeInto(fn, page, totalPages, pageWidthPt);
  try {
    const ctx = {
      containerRect: container.getBoundingClientRect(),
      pageH: bandHeightPt,
      pageW: pageWidthPt,
      commands: [],
      anchors: /* @__PURE__ */ new Map(),
      fontMap: fonts,
      registeredFonts: buildRegisteredFontMap(),
      opacityStack: [],
      blendStack: [],
      counters: /* @__PURE__ */ new Map(),
      fieldCounter: { n: 0 },
    };
    const rootStyle = getComputedStyle(container);
    emitBox(container, rootStyle, ctx);
    await walkChildren(container, rootStyle, ctx);
    for (const cmd of ctx.commands) cmd.page = 1;
    return ctx.commands;
  } finally {
    document.body.removeChild(container);
  }
}
export { captureChrome, measureChromeHeight };
