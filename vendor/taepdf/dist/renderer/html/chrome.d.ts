import type { DrawCommand } from "../types/index.js";
import { type FontBridgeMap } from "./types.js";
export type PageChromeFn = (page: number, totalPages: number) => string;
export declare function measureChromeHeight(
  fn: PageChromeFn,
  pageWidthPt: number,
): Promise<number>;
export declare function captureChrome(
  fn: PageChromeFn,
  page: number,
  totalPages: number,
  pageWidthPt: number,
  bandHeightPt: number,
  fonts: FontBridgeMap,
): Promise<DrawCommand[]>;
