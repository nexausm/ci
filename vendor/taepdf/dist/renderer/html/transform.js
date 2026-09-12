// renderer/html/transform.ts
function parseCSSMatrix(transformStr) {
  const m = transformStr.match(/^matrix\(([^)]+)\)$/);
  if (!m) return null;
  const parts = m[1].split(",").map((v) => parseFloat(v.trim()));
  if (parts.length !== 6 || parts.some(Number.isNaN)) return null;
  return parts;
}
function composeAffine(m2, m1) {
  const [a1, b1, c1, d1, e1, f1] = m1;
  const [a2, b2, c2, d2, e2, f2] = m2;
  return [
    a2 * a1 + c2 * b1,
    b2 * a1 + d2 * b1,
    a2 * c1 + c2 * d1,
    b2 * c1 + d2 * d1,
    a2 * e1 + c2 * f1 + e2,
    b2 * e1 + d2 * f1 + f2,
  ];
}
function buildPdfTransformMatrix(css, originPageX, originPageY, pageH) {
  const [a, b, c, d, e, f] = css;
  const flipped = [a, -b, -c, d, e, -f];
  const pdfOriginX = originPageX;
  const pdfOriginY = pageH - originPageY;
  const toOrigin = [1, 0, 0, 1, -pdfOriginX, -pdfOriginY];
  const fromOrigin = [1, 0, 0, 1, pdfOriginX, pdfOriginY];
  return composeAffine(fromOrigin, composeAffine(flipped, toOrigin));
}
export { buildPdfTransformMatrix, composeAffine, parseCSSMatrix };
