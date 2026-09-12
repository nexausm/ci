// index.ts
import { initEngine, triggerDownload, safeName } from "./engine.js";
import { renderHTMLtoPDF } from "./renderer/index.js";
import {
  previewHTML,
  renderHTMLtoPDF as renderHTMLtoPDF2,
} from "./renderer/index.js";
var _ready = null;
function escapeHtml(s) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
function randomOwnerPassword() {
  return Array.from(crypto.getRandomValues(new Uint8Array(16)))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}
function resolveSecurityOption(opt) {
  if (opt === void 0 || opt === null || typeof opt === "object") return opt;
  if (opt === "open") return null;
  const base = {
    userPassword: "",
    ownerPassword: randomOwnerPassword(),
    permissions: {
      print: true,
      copy: true,
      modify: false,
      annotate: false,
      fillForms: false,
    },
  };
  if (opt === "fillable")
    return { ...base, permissions: { ...base.permissions, fillForms: true } };
  if (opt === "locked")
    return {
      ...base,
      permissions: {
        print: false,
        copy: false,
        modify: false,
        annotate: false,
        fillForms: false,
      },
    };
  return base;
}
var pdf = {
  warmup() {
    if (!_ready) _ready = initEngine().then(() => void 0);
    return _ready;
  },
  async render(html, size = "A4", security, extras = {}) {
    return renderHTMLtoPDF(
      html,
      { size, orientation: extras.orientation },
      {
        security: resolveSecurityOption(security),
        metadata: extras.metadata,
        bookmarks: extras.bookmarks,
        header: extras.header,
        footer: extras.footer,
        taggedPdf: extras.taggedPdf,
        pdfA: extras.pdfA,
      },
    );
  },
  async download(html, size = "A4", filename, security, extras = {}) {
    const bytes = await this.render(html, size, security, extras);
    triggerDownload(bytes, filename);
  },
  name: safeName,
};
var index_default = pdf;
export {
  index_default as default,
  escapeHtml,
  previewHTML,
  renderHTMLtoPDF2 as renderHTMLtoPDF,
};
