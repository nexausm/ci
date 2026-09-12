import type { PageConfig } from "./page.js";
export interface FontRef {
  name: string;
  style: string;
  weight: number;
}
export interface PDFMetadata {
  title?: string;
  author?: string;
  subject?: string;
  keywords?: string[];
  creator?: string;
  language?: string;
}
export interface PDFSecurity {
  userPassword?: string;
  ownerPassword?: string;
  permissions?: {
    print?: boolean;
    copy?: boolean;
    modify?: boolean;
    annotate?: boolean;
    fillForms?: boolean;
  };
}
export interface BookmarkEntry {
  title: string;
  page: number;
  y?: number;
  level?: number;
}
export type AnchorEntry = {
  page: number;
  y: number;
};
export interface StructNode {
  tag: string;
  alt?: string;
  lang?: string;
  kids: StructKid[];
}
export interface McrRef {
  mcid: number;
  page: number;
}
export type StructKid = StructNode | McrRef;
export declare function isMcrRef(k: StructKid): k is McrRef;
export interface DocDefinition {
  config: PageConfig;
  metadata?: PDFMetadata;
  security?: PDFSecurity | null;
  bookmarks?: BookmarkEntry[];
  taggedPdf?: boolean;
  pdfA?: boolean;
}
