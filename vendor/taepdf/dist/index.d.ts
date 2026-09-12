import { safeName } from "./engine.js";
import type {
  PageSize,
  PDFSecurity,
  PDFMetadata,
  BookmarkEntry,
} from "./renderer/types/index.js";
export type SecurityPreset =
  "read-only" | "printable" | "fillable" | "locked" | "open";
export type SecurityOption = SecurityPreset | PDFSecurity | null;
export interface RenderExtras {
  metadata?: PDFMetadata;
  bookmarks?: BookmarkEntry[];
  orientation?: "portrait" | "landscape";
  header?: (page: number, totalPages: number) => string;
  footer?: (page: number, totalPages: number) => string;
  taggedPdf?: boolean;
  pdfA?: boolean;
}
export declare function escapeHtml(s: string): string;
declare const pdf: {
  warmup(): Promise<void>;
  render(
    html: string,
    size?: PageSize,
    security?: SecurityOption,
    extras?: RenderExtras,
  ): Promise<Uint8Array>;
  download(
    html: string,
    size: PageSize | undefined,
    filename: string,
    security?: SecurityOption,
    extras?: RenderExtras,
  ): Promise<void>;
  name: typeof safeName;
};
export default pdf;
export { previewHTML, renderHTMLtoPDF } from "./renderer/index.js";
export type {
  PageSize,
  PageConfig,
  PDFSecurity,
  PDFMetadata,
  BookmarkEntry,
} from "./renderer/types/index.js";
