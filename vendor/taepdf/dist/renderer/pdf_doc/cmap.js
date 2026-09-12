// renderer/pdf_doc/cmap.ts
function toUnicodeCmap(glyphToUnicode) {
  const codes = [...glyphToUnicode.keys()].sort((a, b) => a - b);
  const ranges = [];
  const singles = [];
  const single = (g) => {
    const v = glyphToUnicode.get(g);
    return v.length === 1 ? v[0] : null;
  };
  let i = 0;
  while (i < codes.length) {
    const sg = codes[i];
    const sc = single(sg);
    let end = i;
    while (end + 1 < codes.length && sc !== null && sc <= 65535) {
      const ng = codes[end + 1];
      const nc = single(ng);
      const ec = single(codes[end]);
      if (
        nc === null ||
        ec === null ||
        ng !== codes[end] + 1 ||
        nc !== ec + 1 ||
        ec >= 65535
      )
        break;
      end++;
    }
    if (end > i && sc !== null && sc <= 65535)
      ranges.push([sg, codes[end], sc]);
    else singles.push([sg, glyphToUnicode.get(sg)]);
    i = end + 1;
  }
  const h4 = (n) => n.toString(16).padStart(4, "0");
  const cpHex = (cp) => {
    if (cp <= 65535) return h4(cp);
    const hi = 55296 + ((cp - 65536) >> 10);
    const lo = 56320 + ((cp - 65536) & 1023);
    return h4(hi) + h4(lo);
  };
  const cpsHex = (cps) => cps.map(cpHex).join("");
  let map =
    "/CIDInit /ProcSet findresource begin\n12 dict begin\nbegincmap\n/CIDSystemInfo <<\n  /Registry (Adobe)\n  /Ordering (UCS)\n  /Supplement 0\n>> def\n/CMapName /Adobe-Identity-UCS def\n/CMapType 2 def\n1 begincodespacerange\n<0000><ffff>\nendcodespacerange";
  for (let r = 0; r < ranges.length; r += 100) {
    const batch = ranges.slice(r, r + 100);
    map += `
${batch.length} beginbfrange
`;
    for (const [s, e, cp] of batch)
      map += `<${h4(s)}><${h4(e)}><${cpHex(cp)}>
`;
    map += "endbfrange";
  }
  for (let r = 0; r < singles.length; r += 100) {
    const batch = singles.slice(r, r + 100);
    map += `
${batch.length} beginbfchar
`;
    for (const [g, cps] of batch)
      map += `<${h4(g)}><${cpsHex(cps)}>
`;
    map += "endbfchar";
  }
  map += "\nendcmap\nCMapName currentdict /CMap defineresource pop\nend\nend";
  return map;
}
export { toUnicodeCmap };
