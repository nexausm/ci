// renderer/pdf_doc/build_structtree.ts
import { isMcrRef } from "../types/index.js";
import { toPdfName } from "./utils.js";
function putStructTree(ctx) {
  const root = ctx.structRoot;
  if (!root || root.kids.length === 0) return null;
  const ids = /* @__PURE__ */ new Map();
  const assign = (node) => {
    ids.set(node, ctx.newObjectDeferred());
    for (const kid of node.kids) if (!isMcrRef(kid)) assign(kid);
  };
  for (const kid of root.kids) if (!isMcrRef(kid)) assign(kid);
  const structTreeRootId = ctx.newObjectDeferred();
  const perPage = /* @__PURE__ */ new Map();
  const writeNode = (node, parentRef) => {
    const id = ids.get(node);
    const kidStrs = [];
    for (const kid of node.kids) {
      if (isMcrRef(kid)) {
        const pageRef = ctx.pageObjIds[kid.page - 1];
        kidStrs.push(`<< /Type /MCR /Pg ${pageRef} 0 R /MCID ${kid.mcid} >>`);
        let arr = perPage.get(kid.page);
        if (!arr) {
          arr = [];
          perPage.set(kid.page, arr);
        }
        arr[kid.mcid] = id;
      } else {
        kidStrs.push(`${ids.get(kid)} 0 R`);
      }
    }
    ctx.newObjectDeferredBegin(id, true);
    ctx.out("<<");
    ctx.out("/Type /StructElem");
    ctx.out(`/S /${toPdfName(node.tag)}`);
    ctx.out(`/P ${parentRef}`);
    ctx.out(
      kidStrs.length === 1 ? `/K ${kidStrs[0]}` : `/K [${kidStrs.join(" ")}]`,
    );
    if (node.alt) ctx.out(`/Alt ${ctx.strLit(node.alt)}`);
    if (node.lang) ctx.out(`/Lang ${ctx.strLit(node.lang)}`);
    ctx.out(">>");
    ctx.out("endobj");
    for (const kid of node.kids)
      if (!isMcrRef(kid)) writeNode(kid, `${id} 0 R`);
  };
  const topKids = [];
  for (const kid of root.kids) {
    if (isMcrRef(kid)) continue;
    writeNode(kid, `${structTreeRootId} 0 R`);
    topKids.push(`${ids.get(kid)} 0 R`);
  }
  const numsParts = [];
  for (const [page, arr] of [...perPage.entries()].sort(
    (a, b) => a[0] - b[0],
  )) {
    const arrId = ctx.newObjectDeferred();
    ctx.newObjectDeferredBegin(arrId, true);
    ctx.out(
      `[${arr.map((id) => (id === void 0 ? "null" : `${id} 0 R`)).join(" ")}]`,
    );
    ctx.out("endobj");
    numsParts.push(`${page - 1} ${arrId} 0 R`);
  }
  const parentTreeId = ctx.newObjectDeferred();
  ctx.newObjectDeferredBegin(parentTreeId, true);
  ctx.out(`<< /Nums [${numsParts.join(" ")}] >>`);
  ctx.out("endobj");
  ctx.newObjectDeferredBegin(structTreeRootId, true);
  ctx.out("<<");
  ctx.out("/Type /StructTreeRoot");
  ctx.out(`/K [${topKids.join(" ")}]`);
  ctx.out(`/ParentTree ${parentTreeId} 0 R`);
  ctx.out(`/ParentTreeNextKey ${ctx.pageObjIds.length}`);
  ctx.out(">>");
  ctx.out("endobj");
  return structTreeRootId;
}
export { putStructTree };
