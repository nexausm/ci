import type { Corner, StructNode } from "../types/index.js";
import type { RawImage } from "../images/decode.js";
export declare class PdfDoc {
  private buf;
  private byteLen;
  private objectNumber;
  private offsets;
  private fonts;
  private fontMap;
  private usedFonts;
  private images;
  private gradDefs;
  private shadPats;
  private gradSoftMasks;
  private extGStates;
  private allPageBufs;
  private pageAnnots;
  private currentPageIdx;
  private pageObjIds;
  private formFieldObjIds;
  private apBuf;
  private rootDictObjId;
  private resourceDictObjId;
  private security?;
  private fileId;
  private metadata;
  private bookmarks;
  private namedDests;
  private objStmQueue;
  private objStmMembers;
  private captureStack;
  private structRoot?;
  private pdfA;
  private pdfaLang?;
  private formatW;
  private formatH;
  private creationDate;
  private activeFontKey;
  private activeFontSize;
  private activeCharSpace;
  private activeWordSpace;
  private strokeColor;
  private textColor;
  private lineWidth;
  private lastFontKey;
  private lastFontSize;
  private lastLeading;
  private lastNonstroke;
  private lastStroke;
  private lastLineWidth;
  private lastCharSpace;
  private lastWordSpace;
  private lastTextRenderMode;
  private glyphImageCache;
  private colrCache;
  private bitmapCache;
  private gsStack;
  constructor(width: number, height: number);
  private get ctx();
  private write;
  private writeBytes;
  private newObjectDeferred;
  private newObjectDeferredBegin;
  private newObject;
  private out;
  private outBytes;
  encryptedLength(plainLen: number): number;
  private beginCapture;
  private endCapture;
  private queueForObjStm;
  private strLit;
  private encBytes;
  private pageOut;
  private captureAppearance;
  private putStyle;
  private addPageInternal;
  private getOrCreateFont;
  set_font(fontName: string, fontStyle: string, cssWeight: number): void;
  set_font_size(size: number): void;
  set_char_space(space: number): void;
  set_word_spacing(pt: number): void;
  set_draw_color(r: number, g: number, b: number): void;
  set_fill_color(r: number, g: number, b: number): void;
  set_text_color(r: number, g: number, b: number): void;
  set_line_width(width: number): void;
  set_line_dash(dashArray: number[] | null, dashPhase: number): void;
  set_line_cap(cap: number): void;
  set_line_join(join: number): void;
  save_graphics_state(): void;
  restore_graphics_state(): void;
  set_alpha(opacity: number, blend?: string): void;
  set_clip_rect(x: number, y: number, w: number, h: number): void;
  set_clip_outside_rounded_rect(
    x: number,
    y: number,
    w: number,
    h: number,
    tl: Corner,
    tr: Corner,
    br: Corner,
    bl: Corner,
  ): void;
  set_clip_rounded_rect(
    x: number,
    y: number,
    w: number,
    h: number,
    tl: Corner,
    tr: Corner,
    br: Corner,
    bl: Corner,
  ): void;
  private emitPathOps;
  set_clip_path(
    ops: {
      op: "m" | "l" | "c";
      args: number[];
    }[],
    evenOdd: boolean,
  ): void;
  draw_path(
    ops: {
      op: "m" | "l" | "c";
      args: number[];
    }[],
    evenOdd: boolean,
    fill?: [number, number, number],
    gradientFill?: {
      gradientId: number;
      x: number;
      y: number;
      w: number;
      h: number;
    },
    stroke?: {
      color: [number, number, number];
      width: number;
      dash?: number[];
      lineCap?: number;
      lineJoin?: number;
    },
  ): void;
  set_transform(matrix: number[]): void;
  begin_marked_content(structTag: string, mcid: number): void;
  end_marked_content(): void;
  text(
    text: string,
    x: number,
    y: number,
    baseline: string,
    stroke?: {
      color: [number, number, number];
      width: number;
      strokeOnly: boolean;
    },
  ): void;
  private emitColorGlyphRun;
  text_vertical(
    text: string,
    x: number,
    yTop: number,
    stroke?: {
      color: [number, number, number];
      width: number;
      strokeOnly: boolean;
    },
  ): void;
  private pathRect;
  private pathRoundedRect;
  rect(x: number, y: number, w: number, h: number, style: string): void;
  rounded_rect(
    x: number,
    y: number,
    w: number,
    h: number,
    tl: Corner,
    tr: Corner,
    br: Corner,
    bl: Corner,
    style: string,
  ): void;
  border_ring(
    x: number,
    y: number,
    w: number,
    h: number,
    tl: Corner,
    tr: Corner,
    br: Corner,
    bl: Corner,
    strokeWidth: number,
  ): void;
  stroke_rounded_rect_dashed(
    x: number,
    y: number,
    w: number,
    h: number,
    tl: Corner,
    tr: Corner,
    br: Corner,
    bl: Corner,
    strokeWidth: number,
    dashArray: number[],
  ): void;
  line(x1: number, y1: number, x2: number, y2: number): void;
  wavy_line(
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    amplitude: number,
    wavelength: number,
  ): void;
  add_gradient(
    gradType: number,
    angle: number,
    stops: Float64Array,
    cx?: number,
    cy?: number,
    fx?: number,
    fy?: number,
  ): number;
  private registerSoftMaskIfNeeded;
  fill_with_gradient(
    gradientId: number,
    x: number,
    y: number,
    w: number,
    h: number,
  ): void;
  fill_with_gradient_rounded(
    gradientId: number,
    x: number,
    y: number,
    w: number,
    h: number,
    tl: Corner,
    tr: Corner,
    br: Corner,
    bl: Corner,
  ): void;
  embed_image(bytes: Uint8Array): number;
  embed_raw_image(raw: RawImage): number;
  draw_image(imageId: number, x: number, y: number, w: number, h: number): void;
  add_link_annotation(
    x: number,
    y: number,
    w: number,
    h: number,
    url: string,
  ): void;
  add_goto_annotation(
    x: number,
    y: number,
    w: number,
    h: number,
    destPage: number,
    destY: number,
  ): void;
  add_form_field(
    x: number,
    y: number,
    w: number,
    h: number,
    fieldType: "Tx" | "Btn" | "Ch",
    name: string,
    fontName: string,
    fontStyle: string,
    weight: number,
    size: number,
    color: [number, number, number],
    value: string | undefined,
    checked: boolean | undefined,
    options: string[] | undefined,
  ): void;
  private buildCheckboxAppearances;
  add_named_dest(name: string, page: number, y: number): void;
  set_metadata(key: string, value: string): void;
  add_bookmark(title: string, page: number, y: number, level: number): void;
  set_security(userPw: string, ownerPw: string, permissions: number): void;
  set_struct_tree(root: StructNode): void;
  set_pdfa(lang: string | undefined): void;
  add_page(): void;
  set_page(n: number): void;
  output(): Uint8Array;
  private buildDocument;
}
