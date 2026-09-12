import type { StructNode } from "../types/index.js";
export interface DocFont {
  id: string;
  fontName: string;
  style: string;
  weight: number;
  opsz: number;
  glyphIds: Set<number>;
  glyphToUnicode: Map<number, number[]>;
  objectNumber: number;
  isAlreadyPutted: boolean;
  usedVertically: boolean;
  verticalObjectNumber: number;
}
export interface EmbedImage {
  name: string;
  width: number;
  height: number;
  colorSpace: string;
  filter: string;
  data: Uint8Array;
  smask: Uint8Array | null;
  decodeInvert: boolean;
  orientation: number;
  objectNumber: number;
}
export interface SecurityConfig {
  fileKey: Uint8Array;
  o: Uint8Array;
  u: Uint8Array;
  oe: Uint8Array;
  ue: Uint8Array;
  perms: Uint8Array;
  permissions: number;
}
export interface GradDef {
  gradType: number;
  angle: number;
  cx: number;
  cy: number;
  fx: number;
  fy: number;
  stops: [number, number, number, number, number][];
}
export interface ShadPat {
  patName: string;
  defIdx: number;
  x: number;
  y: number;
  w: number;
  h: number;
  pageH: number;
  objId: number;
}
export interface GradSoftMask {
  gsName: string;
  defIdx: number;
  x: number;
  y: number;
  w: number;
  h: number;
  pageH: number;
  objId: number;
}
export interface Bookmark {
  title: string;
  page: number;
  y: number;
  level: number;
}
export interface PageAnnot {
  rect: [number, number, number, number];
  href?: string;
  destPage?: number;
  destY?: number;
  fieldType?: "Tx" | "Btn" | "Ch";
  fieldName?: string;
  fieldDA?: string;
  fieldValue?: string;
  fieldChecked?: boolean;
  fieldOptions?: string[];
  fieldApOn?: string;
  fieldApOff?: string;
}
export interface ObjStmItem {
  oid: number;
  content: string;
}
export interface InternalCtx {
  buf: Uint8Array[];
  byteLen: number;
  objectNumber: number;
  offsets: number[];
  fonts: DocFont[];
  usedFonts: Set<string>;
  images: EmbedImage[];
  gradDefs: GradDef[];
  shadPats: ShadPat[];
  gradSoftMasks: GradSoftMask[];
  extGStates: {
    alpha: number;
    blend: string;
  }[];
  allPageBufs: string[][];
  pageAnnots: PageAnnot[][];
  pageObjIds: number[];
  rootDictObjId: number;
  resourceDictObjId: number;
  security: SecurityConfig | undefined;
  fileId: Uint8Array;
  creationDate: string;
  metadata: [string, string][];
  bookmarks: Bookmark[];
  namedDests: [string, number, number][];
  objStmQueue: ObjStmItem[];
  objStmMembers: [number, number, number][];
  formatW: number;
  formatH: number;
  structRoot: StructNode | undefined;
  pdfA: boolean;
  pdfaLang: string | undefined;
  formFieldObjIds: number[];
  write(s: string): void;
  writeBytes(b: Uint8Array): void;
  out(s: string): void;
  outBytes(b: Uint8Array): void;
  newObject(): number;
  newObjectDeferred(): number;
  newObjectDeferredBegin(oid: number, doOutput: boolean): void;
  queueForObjStm(content: string): number;
  beginCapture(): void;
  endCapture(): string;
  strLit(s: string): string;
  encBytes(data: Uint8Array): Uint8Array;
  encryptedLength(plainLen: number): number;
}
