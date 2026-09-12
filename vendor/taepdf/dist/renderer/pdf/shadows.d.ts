import type { BoxShadow, ResolvedRadius } from "../types/index.js";
import type { PdfDoc } from "../pdf_doc/index.js";
export declare function emitShadows(
  doc: PdfDoc,
  shadows: BoxShadow[],
  x: number,
  y: number,
  w: number,
  h: number,
  rr: ResolvedRadius,
): void;
