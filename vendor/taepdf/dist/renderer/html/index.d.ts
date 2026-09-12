import type { PageConfig } from "../types/index.js";
import {
  type FontBridgeMap,
  type HTMLCapture,
  type HTMLToPDFOptions,
} from "./types.js";
import { type PageChromeFn } from "./chrome.js";
export type { FontBridgeMap, HTMLCapture, HTMLToPDFOptions };
export { invalidateFontMapCache } from "./fonts.js";
export { invalidateImageCache } from "./images.js";
export declare function fromDOM(
  el: HTMLElement,
  config: PageConfig,
  fonts?: FontBridgeMap,
  taggedPdf?: boolean,
): Promise<HTMLCapture>;
export declare function fromHTML(
  html: string,
  config: PageConfig,
  fonts?: FontBridgeMap,
  chrome?: {
    header?: PageChromeFn;
    footer?: PageChromeFn;
  },
  taggedPdf?: boolean,
): Promise<HTMLCapture>;
export declare function previewHTML(
  html: string,
  container: HTMLElement,
  config: PageConfig,
): void;
export declare function renderHTMLtoPDF(
  html: string,
  config: PageConfig,
  options?: HTMLToPDFOptions,
  fonts?: FontBridgeMap,
): Promise<Uint8Array>;
