// renderer/pdf_doc/build_pdfa.ts
import { buildSRGBProfile } from "./icc.js";
import pkg from "../../package.json" with { type: "json" };
function xmlEscape(s) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}
function putPdfAExtras(ctx) {
  if (!ctx.pdfA) return null;
  const profile = buildSRGBProfile();
  const iccId = ctx.newObject();
  ctx.out("<<");
  ctx.out("/N 3");
  ctx.out(`/Length ${ctx.encryptedLength(profile.length)}`);
  ctx.out(">>");
  ctx.out("stream");
  ctx.outBytes(profile);
  ctx.out("endstream");
  ctx.out("endobj");
  const outputIntentId = ctx.newObject();
  ctx.out("<<");
  ctx.out("/Type /OutputIntent");
  ctx.out("/S /GTS_PDFA1");
  ctx.out(`/OutputConditionIdentifier ${ctx.strLit("sRGB IEC61966-2.1")}`);
  ctx.out(`/Info ${ctx.strLit("sRGB IEC61966-2.1")}`);
  ctx.out(`/DestOutputProfile ${iccId} 0 R`);
  ctx.out(">>");
  ctx.out("endobj");
  const lang = ctx.pdfaLang ?? "en-US";
  const title = ctx.metadata.find(([k]) => k === "Title")?.[1];
  const author = ctx.metadata.find(([k]) => k === "Author")?.[1];
  const titleXml = title
    ? `<dc:title><rdf:Alt><rdf:li xml:lang="x-default">${xmlEscape(title)}</rdf:li></rdf:Alt></dc:title>`
    : "";
  const authorXml = author
    ? `<dc:creator><rdf:Seq><rdf:li>${xmlEscape(author)}</rdf:li></rdf:Seq></dc:creator>`
    : "";
  const xmp = `<?xpacket begin="\uFEFF" id="W5M0MpCehiHzreSzNTczkc9d"?>
<x:xmpmeta xmlns:x="adobe:ns:meta/">
<rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#">
<rdf:Description rdf:about="" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:pdf="http://ns.adobe.com/pdf/1.3/" xmlns:xmp="http://ns.adobe.com/xap/1.0/" xmlns:pdfaid="http://www.aiim.org/pdfa/ns/id/">
${titleXml}${authorXml}<dc:language><rdf:Bag><rdf:li>${xmlEscape(lang)}</rdf:li></rdf:Bag></dc:language>
<pdf:Producer>${xmlEscape(`taepdf ${pkg.version}`)}</pdf:Producer>
<xmp:CreateDate>${/* @__PURE__ */ new Date().toISOString()}</xmp:CreateDate>
<pdfaid:part>2</pdfaid:part>
<pdfaid:conformance>A</pdfaid:conformance>
</rdf:Description>
</rdf:RDF>
</x:xmpmeta>
<?xpacket end="w"?>`;
  const xmpBytes = new TextEncoder().encode(xmp);
  const metadataId = ctx.newObject();
  ctx.out("<<");
  ctx.out("/Type /Metadata");
  ctx.out("/Subtype /XML");
  ctx.out(`/Length ${ctx.encryptedLength(xmpBytes.length)}`);
  ctx.out(">>");
  ctx.out("stream");
  ctx.outBytes(xmpBytes);
  ctx.out("endstream");
  ctx.out("endobj");
  return { outputIntentId, metadataId };
}
export { putPdfAExtras };
