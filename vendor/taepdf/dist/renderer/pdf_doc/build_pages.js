// renderer/pdf_doc/build_pages.ts
import { hpf, _te } from "./utils.js";
import { deflate } from "./deflate.js";
function putCompressedStream(ctx, data) {
  const comp = deflate(data);
  ctx.out("<<");
  ctx.out(`/Length ${ctx.encryptedLength(comp.length)}`);
  ctx.out("/Filter /FlateDecode");
  ctx.out(">>");
  ctx.out("stream");
  ctx.outBytes(comp);
  ctx.out("endstream");
}
function putAppearanceStream(ctx, w, h, body) {
  const oid = ctx.newObjectDeferred();
  ctx.newObjectDeferredBegin(oid, true);
  const bytes = _te.encode(body);
  ctx.out("<<");
  ctx.out("/Type /XObject");
  ctx.out("/Subtype /Form");
  ctx.out("/FormType 1");
  ctx.out(`/BBox [0 0 ${hpf(w)} ${hpf(h)}]`);
  ctx.out(`/Resources ${ctx.resourceDictObjId} 0 R`);
  ctx.out(`/Length ${ctx.encryptedLength(bytes.length)}`);
  ctx.out(">>");
  ctx.out("stream");
  ctx.outBytes(bytes);
  ctx.out("endstream");
  ctx.out("endobj");
  return oid;
}
function putFieldWidget(ctx, oid, pageObjId, ann, apIds) {
  ctx.newObjectDeferredBegin(oid, true);
  ctx.out("<<");
  ctx.out("/Type /Annot");
  ctx.out("/Subtype /Widget");
  ctx.out(`/FT /${ann.fieldType}`);
  ctx.out(`/T ${ctx.strLit(ann.fieldName ?? "")}`);
  ctx.out(`/P ${pageObjId} 0 R`);
  ctx.out(
    `/Rect [${hpf(ann.rect[0])} ${hpf(ann.rect[1])} ${hpf(ann.rect[2])} ${hpf(ann.rect[3])}]`,
  );
  ctx.out("/Border [0 0 0]");
  if (ann.fieldDA) ctx.out(`/DA ${ctx.strLit(ann.fieldDA)}`);
  if (ann.fieldType === "Btn") {
    ctx.out(`/AP << /N << /On ${apIds.onId} 0 R /Off ${apIds.offId} 0 R >> >>`);
    ctx.out(`/AS /${ann.fieldChecked ? "On" : "Off"}`);
    ctx.out(`/V /${ann.fieldChecked ? "On" : "Off"}`);
  } else {
    ctx.out(`/AP << /N ${apIds.onId} 0 R >>`);
    ctx.out(`/V ${ctx.strLit(ann.fieldValue ?? "")}`);
    if (ann.fieldType === "Ch" && ann.fieldOptions) {
      ctx.out(`/Opt [${ann.fieldOptions.map((o) => ctx.strLit(o)).join(" ")}]`);
    }
  }
  ctx.out(">>");
  ctx.out("endobj");
}
function putPages(ctx) {
  const pageCount = ctx.allPageBufs.length;
  const rootId = ctx.rootDictObjId;
  const resId = ctx.resourceDictObjId;
  const fmtW = ctx.formatW;
  const fmtH = ctx.formatH;
  const pageObjIds = [];
  const contentObjIds = [];
  for (let i = 0; i < pageCount; i++) {
    pageObjIds.push(ctx.newObjectDeferred());
    contentObjIds.push(ctx.newObjectDeferred());
  }
  ctx.pageObjIds = pageObjIds;
  const annotObjIdsList = [];
  for (let n = 0; n < pageCount; n++) {
    const annots = ctx.pageAnnots[n] ?? [];
    annotObjIdsList.push(annots.map(() => ctx.newObjectDeferred()));
  }
  for (let n = 0; n < pageCount; n++) {
    const pageObjId = pageObjIds[n];
    const contObjId = contentObjIds[n];
    const annots = ctx.pageAnnots[n] ?? [];
    const annotIds = annotObjIdsList[n];
    ctx.newObjectDeferredBegin(pageObjId, true);
    ctx.out("<</Type /Page");
    ctx.out(`/Parent ${rootId} 0 R`);
    ctx.out(`/Resources ${resId} 0 R`);
    ctx.out(`/MediaBox [0 0 ${hpf(fmtW)} ${hpf(fmtH)}]`);
    ctx.out(`/Contents ${contObjId} 0 R`);
    if (ctx.structRoot) ctx.out(`/StructParents ${n}`);
    if (annotIds.length) {
      ctx.out(`/Annots [${annotIds.map((id) => `${id} 0 R`).join(" ")}]`);
    }
    ctx.out(">>");
    ctx.out("endobj");
    ctx.newObjectDeferredBegin(contObjId, true);
    putCompressedStream(ctx, _te.encode(ctx.allPageBufs[n].join("\n")));
    ctx.out("endobj");
    for (let i = 0; i < annots.length; i++) {
      const ann = annots[i];
      const oid = annotIds[i];
      if (ann.fieldType) {
        const w = ann.rect[2] - ann.rect[0];
        const h = ann.rect[3] - ann.rect[1];
        const onId = putAppearanceStream(ctx, w, h, ann.fieldApOn ?? "");
        const offId =
          ann.fieldType === "Btn"
            ? putAppearanceStream(ctx, w, h, ann.fieldApOff ?? "")
            : void 0;
        putFieldWidget(ctx, oid, pageObjId, ann, { onId, offId });
        ctx.formFieldObjIds.push(oid);
        continue;
      }
      ctx.newObjectDeferredBegin(oid, true);
      ctx.out("<<");
      ctx.out("/Type /Annot");
      ctx.out("/Subtype /Link");
      ctx.out(
        `/Rect [${hpf(ann.rect[0])} ${hpf(ann.rect[1])} ${hpf(ann.rect[2])} ${hpf(ann.rect[3])}]`,
      );
      ctx.out("/Border [0 0 0]");
      if (ann.href !== void 0) {
        const lit = ctx.strLit(ann.href);
        ctx.out(`/A <</S /URI /URI ${lit}>>`);
      } else if (ann.destPage !== void 0) {
        const pg = Math.min(
          Math.max(0, ann.destPage - 1),
          ctx.pageObjIds.length - 1,
        );
        const ref = ctx.pageObjIds[pg] ?? 0;
        ctx.out(
          `/A <</S /GoTo /D [${ref} 0 R /XYZ null ${hpf(ann.destY ?? 0)} null]>>`,
        );
      }
      ctx.out(">>");
      ctx.out("endobj");
    }
  }
  ctx.newObjectDeferredBegin(rootId, true);
  ctx.out("<</Type /Pages");
  ctx.out(`/Kids [${pageObjIds.map((id) => `${id} 0 R`).join(" ")}]`);
  ctx.out(`/Count ${pageCount}`);
  ctx.out(">>");
  ctx.out("endobj");
}
export { putPages };
