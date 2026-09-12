// renderer/pdf/finalize.ts
function applyMetadata(doc, m) {
  if (m.title) doc.set_metadata("Title", m.title);
  if (m.author) doc.set_metadata("Author", m.author);
  if (m.subject) doc.set_metadata("Subject", m.subject);
  if (m.keywords) doc.set_metadata("Keywords", m.keywords.join(", "));
  if (m.creator) doc.set_metadata("Creator", m.creator);
  if (m.language) doc.set_metadata("Lang", m.language);
}
function applyBookmarks(doc, bookmarks) {
  const safeLevel = (raw) =>
    Number.isFinite(raw) ? Math.max(0, Math.floor(raw)) : 0;
  for (const bm of bookmarks)
    doc.add_bookmark(bm.title, bm.page, bm.y ?? 0, safeLevel(bm.level));
}
function applySecurity(doc, sec) {
  const p = sec.permissions;
  let perm = 4294967292;
  if (p?.print === false) perm &= ~4;
  if (p?.modify === false) perm &= ~8;
  if (p?.copy === false) perm &= ~16;
  if (p?.annotate === false) perm &= ~32;
  if (p?.fillForms === false) perm &= ~256;
  doc.set_security(sec.userPassword ?? "", sec.ownerPassword ?? "", perm >>> 0);
}
function applyStructTree(doc, structRoot) {
  doc.set_struct_tree(structRoot);
}
function applyPdfA(doc, metadata) {
  doc.set_pdfa(metadata?.language);
}
function resolveSecurityConfig(security) {
  if (security === void 0) {
    return {
      userPassword: "",
      ownerPassword: Array.from(crypto.getRandomValues(new Uint8Array(16)))
        .map((b) => b.toString(16).padStart(2, "0"))
        .join(""),
      permissions: {
        print: true,
        copy: true,
        modify: false,
        annotate: false,
        fillForms: false,
      },
    };
  }
  return security;
}
export {
  applyBookmarks,
  applyMetadata,
  applyPdfA,
  applySecurity,
  applyStructTree,
  resolveSecurityConfig,
};
