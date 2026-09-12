import type { FontRef } from "../types/index.js";
import type { FontBridgeMap } from "./types.js";
export declare function invalidateFontMapCache(): void;
export declare function buildRegisteredFontMap(): Map<string, string[]>;
export declare function resolveFontRef(
  family: string,
  weight: string,
  fStyle: string,
  fontMap: FontBridgeMap,
  reg: Map<string, string[]>,
): FontRef | null;
export declare function resolveGlyphFallback(
  codepoint: number,
  primary: FontRef,
  family: string,
  weight: string,
  fStyle: string,
  fontMap: FontBridgeMap,
  reg: Map<string, string[]>,
): FontRef | null;
export interface FontRun {
  text: string;
  font: FontRef;
}
export declare function splitByFontCoverage(
  text: string,
  primary: FontRef,
  family: string,
  weight: string,
  fStyle: string,
  fontMap: FontBridgeMap,
  reg: Map<string, string[]>,
): FontRun[];
