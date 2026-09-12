import type {
  PDFMetadata,
  PDFSecurity,
  BookmarkEntry,
  StructNode,
} from "../types/index.js";
import type { PdfDoc } from "../pdf_doc/index.js";
export declare function applyMetadata(doc: PdfDoc, m: PDFMetadata): void;
export declare function applyBookmarks(
  doc: PdfDoc,
  bookmarks: BookmarkEntry[],
): void;
export declare function applySecurity(doc: PdfDoc, sec: PDFSecurity): void;
export declare function applyStructTree(
  doc: PdfDoc,
  structRoot: StructNode,
): void;
export declare function applyPdfA(
  doc: PdfDoc,
  metadata: PDFMetadata | undefined,
): void;
export declare function resolveSecurityConfig(
  security: PDFSecurity | null | undefined,
): PDFSecurity | null;
