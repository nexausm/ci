import type {
  DrawCommand,
  AnchorEntry,
  PDFMetadata,
  PDFSecurity,
  BookmarkEntry,
  StructNode,
} from "../types/index.js";
import type { CounterMap } from "./counters.js";
export type { StructNode };
export declare const PX_PER_PT: number;
export interface FontBridgeMap {
  [cssFontFamily: string]: {
    name: string;
    style: string;
    weight: number;
  };
}
export interface HTMLCapture {
  commands: DrawCommand[];
  pageCount: number;
  anchors: Map<string, AnchorEntry>;
  structRoot?: StructNode;
}
export interface HTMLToPDFOptions {
  metadata?: PDFMetadata;
  security?: PDFSecurity | null;
  bookmarks?: BookmarkEntry[];
  header?: (page: number, totalPages: number) => string;
  footer?: (page: number, totalPages: number) => string;
  taggedPdf?: boolean;
  pdfA?: boolean;
}
export interface WalkerCtx {
  containerRect: DOMRect;
  pageH: number;
  pageW: number;
  commands: DrawCommand[];
  anchors: Map<string, AnchorEntry>;
  fontMap: FontBridgeMap;
  registeredFonts: Map<string, string[]>;
  opacityStack: number[];
  blendStack: string[];
  counters: CounterMap;
  struct?: {
    root: StructNode;
    stack: StructNode[];
    mcidCounters: Map<number, number>;
    artifactDepth: number;
  };
  fieldCounter: {
    n: number;
  };
  fixedElements?: DrawCommand[][];
}
export declare function domRectToPt(
  r: DOMRect,
  cRect: DOMRect,
): {
  x: number;
  y: number;
  w: number;
  h: number;
};
export declare function paginate(
  yPt: number,
  pageH: number,
): {
  page: number;
  y: number;
};
export declare function paginateSpan(
  yPt: number,
  h: number,
  pageH: number,
): Array<{
  page: number;
  y: number;
}>;
export declare function stackOpacity(ctx: WalkerCtx): number | undefined;
export declare function cssBlendToPdf(
  v: string | undefined,
): string | undefined;
export declare function stackBlend(ctx: WalkerCtx): string | undefined;
export declare function enterStruct(
  el: Element,
  tag: string,
  ctx: WalkerCtx,
): StructNode | "artifact" | undefined;
export declare function exitStruct(
  ctx: WalkerCtx,
  entry: StructNode | "artifact" | undefined,
): void;
export declare function tagStructContent(
  ctx: WalkerCtx,
  page: number,
):
  | {
      mcid: number;
      tag: string;
    }
  | undefined;
export declare function pruneStructTreePages(
  node: StructNode,
  pageCount: number,
): void;
