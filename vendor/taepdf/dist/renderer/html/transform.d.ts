export type Affine = [number, number, number, number, number, number];
export declare function parseCSSMatrix(transformStr: string): Affine | null;
export declare function composeAffine(m2: Affine, m1: Affine): Affine;
export declare function buildPdfTransformMatrix(
  css: Affine,
  originPageX: number,
  originPageY: number,
  pageH: number,
): Affine;
