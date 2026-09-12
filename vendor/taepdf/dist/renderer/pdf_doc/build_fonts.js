// renderer/pdf_doc/build_fonts.ts
import { toPdfName, bboxToPdf, widthsToPdf, w2ToPdf, _te } from "./utils.js";
import { toUnicodeCmap } from "./cmap.js";
import {
  get_advance_widths,
  get_vertical_advance,
  subset_font_full,
} from "../../taetype/taetype.js";
import { deflate } from "./deflate.js";
function embedFont(ctx, fontIdx) {
  const font = ctx.fonts[fontIdx];
  const gids = new Uint16Array([...font.glyphIds].sort((a, b) => a - b));
  const result = subset_font_full(
    font.fontName,
    font.style,
    font.weight,
    font.opsz,
    gids,
  );
  if (!result) return;
  const {
    fontBytes,
    glyphMap,
    isCff,
    ascender,
    descender,
    capHeight,
    bbox,
    flags,
    italicAngle,
    fontName,
  } = result;
  if (!fontBytes) return;
  const rawAdvs = get_advance_widths(
    font.fontName,
    font.style,
    font.weight,
    font.opsz,
    gids,
  );
  const widths = Array.from(gids, (gid, i) => [gid, Math.round(rawAdvs[i])]);
  const fontTableId = ctx.newObject();
  const compFont = deflate(fontBytes);
  ctx.out("<<");
  ctx.out(`/Length ${ctx.encryptedLength(compFont.length)}`);
  if (isCff) {
    ctx.out("/Subtype /CIDFontType0C");
  } else {
    ctx.out(`/Length1 ${fontBytes.length}`);
  }
  ctx.out("/Filter /FlateDecode");
  ctx.out(">>");
  ctx.out("stream");
  ctx.outBytes(compFont);
  ctx.out("endstream");
  ctx.out("endobj");
  const cmapText = toUnicodeCmap(font.glyphToUnicode);
  const compCmap = deflate(_te.encode(cmapText));
  const cmapId = ctx.newObject();
  ctx.out("<<");
  ctx.out(`/Length ${ctx.encryptedLength(compCmap.length)}`);
  ctx.out("/Filter /FlateDecode");
  ctx.out(">>");
  ctx.out("stream");
  ctx.outBytes(compCmap);
  ctx.out("endstream");
  ctx.out("endobj");
  let cidToGidId = 0;
  if (!isCff) {
    const maxCid = gids.length ? Math.max(...gids) : 0;
    const mapBytes = new Uint8Array((maxCid + 1) * 2);
    const gm = glyphMap;
    for (const orig of gids) {
      const compact = orig < gm.length ? gm[orig] : 0;
      mapBytes[orig * 2] = (compact >> 8) & 255;
      mapBytes[orig * 2 + 1] = compact & 255;
    }
    const compMap = deflate(mapBytes);
    cidToGidId = ctx.newObject();
    ctx.out("<<");
    ctx.out(`/Length ${ctx.encryptedLength(compMap.length)}`);
    ctx.out("/Filter /FlateDecode");
    ctx.out(">>");
    ctx.out("stream");
    ctx.outBytes(compMap);
    ctx.out("endstream");
    ctx.out("endobj");
  }
  ctx.beginCapture();
  ctx.out("<<");
  ctx.out("/Type /FontDescriptor");
  ctx.out(`/FontName /${toPdfName(fontName)}`);
  ctx.out(`/${isCff ? "FontFile3" : "FontFile2"} ${fontTableId} 0 R`);
  ctx.out(`/FontBBox ${bboxToPdf(Array.from(bbox))}`);
  ctx.out(`/Flags ${flags}`);
  ctx.out("/StemV 0");
  ctx.out(`/ItalicAngle ${italicAngle}`);
  ctx.out(`/Ascent ${ascender}`);
  ctx.out(`/Descent ${descender}`);
  ctx.out(`/CapHeight ${capHeight}`);
  ctx.out(">>");
  const fontDescriptorId = ctx.queueForObjStm(ctx.endCapture());
  ctx.beginCapture();
  ctx.out("<<");
  ctx.out("/Type /Font");
  ctx.out(`/BaseFont /${toPdfName(fontName)}`);
  ctx.out(`/FontDescriptor ${fontDescriptorId} 0 R`);
  ctx.out(`/W ${widthsToPdf(widths)}`);
  if (!isCff) ctx.out(`/CIDToGIDMap ${cidToGidId} 0 R`);
  ctx.out("/DW 1000");
  ctx.out(`/Subtype ${isCff ? "/CIDFontType0" : "/CIDFontType2"}`);
  ctx.out("/CIDSystemInfo");
  ctx.out("<<");
  ctx.out("/Supplement 0");
  ctx.out("/Registry (Adobe)");
  ctx.out("/Ordering (Identity)");
  ctx.out(">>");
  ctx.out(">>");
  const descendantId = ctx.queueForObjStm(ctx.endCapture());
  ctx.beginCapture();
  ctx.out("<<");
  ctx.out("/Type /Font");
  ctx.out("/Subtype /Type0");
  ctx.out(`/ToUnicode ${cmapId} 0 R`);
  ctx.out(`/BaseFont /${toPdfName(fontName)}`);
  ctx.out("/Encoding /Identity-H");
  ctx.out(`/DescendantFonts [${descendantId} 0 R]`);
  ctx.out(">>");
  const type0Id = ctx.queueForObjStm(ctx.endCapture());
  font.objectNumber = type0Id;
  font.isAlreadyPutted = true;
  if (font.usedVertically) {
    const w2 = [];
    for (let i = 0; i < gids.length; i++) {
      const gid = gids[i];
      const rawV = get_vertical_advance(
        font.fontName,
        font.style,
        font.weight,
        font.opsz,
        gid,
      );
      if (rawV <= 0) continue;
      const w1y = -Math.round(rawV);
      const v1x = Math.round(widths[i][1] / 2);
      w2.push([gid, w1y, v1x, ascender]);
    }
    ctx.beginCapture();
    ctx.out("<<");
    ctx.out("/Type /Font");
    ctx.out(`/BaseFont /${toPdfName(fontName)}`);
    ctx.out(`/FontDescriptor ${fontDescriptorId} 0 R`);
    ctx.out(`/W2 ${w2ToPdf(w2)}`);
    if (!isCff) ctx.out(`/CIDToGIDMap ${cidToGidId} 0 R`);
    ctx.out(`/DW2 [${ascender} -1000]`);
    ctx.out("/DW 1000");
    ctx.out(`/Subtype ${isCff ? "/CIDFontType0" : "/CIDFontType2"}`);
    ctx.out("/CIDSystemInfo");
    ctx.out("<<");
    ctx.out("/Supplement 0");
    ctx.out("/Registry (Adobe)");
    ctx.out("/Ordering (Identity)");
    ctx.out(">>");
    ctx.out(">>");
    const descendantVId = ctx.queueForObjStm(ctx.endCapture());
    ctx.beginCapture();
    ctx.out("<<");
    ctx.out("/Type /Font");
    ctx.out("/Subtype /Type0");
    ctx.out(`/ToUnicode ${cmapId} 0 R`);
    ctx.out(`/BaseFont /${toPdfName(fontName)}`);
    ctx.out("/Encoding /Identity-V");
    ctx.out(`/DescendantFonts [${descendantVId} 0 R]`);
    ctx.out(">>");
    font.verticalObjectNumber = ctx.queueForObjStm(ctx.endCapture());
  }
}
function putFonts(ctx) {
  for (let i = 0; i < ctx.fonts.length; i++) {
    const font = ctx.fonts[i];
    if (!ctx.usedFonts.has(font.id)) continue;
    if (font.isAlreadyPutted) continue;
    if (font.glyphIds.size <= 1) continue;
    embedFont(ctx, i);
  }
}
export { putFonts };
