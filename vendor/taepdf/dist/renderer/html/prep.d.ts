export declare function waitForLayout(): Promise<void>;
export declare function injectWordBreaks(root: Node, chunkSize?: number): void;
export declare function nextScopeId(): string;
export declare function parseSafeHTML(html: string, scopeId: string): Document;
export declare function safeInjectParsed(
  doc: Document,
  container: HTMLElement,
  scopeId: string,
): void;
export declare function createHiddenContainer(
  pageWPt: number,
  pageHPt?: number,
): HTMLDivElement;
export declare function extractFontFaceBlocks(css: string): string[];
export declare function autoRegisterFonts(styleText: string): Promise<void>;
