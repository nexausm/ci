import type {
  ColorAlpha,
  BorderRadius,
  BoxShadow,
  Gradient,
  GradientStop,
  ConicGradient,
} from "../types/index.js";
export declare function parseColorAlpha(
  css: string,
  keepZeroAlpha?: boolean,
): ColorAlpha | null;
export declare function splitByTopLevelComma(s: string): string[];
export declare function splitPositionPair(v: string): string[];
export declare function tileStops(
  stops: GradientStop[],
  repeating: boolean | undefined,
): GradientStop[];
export declare function parseCSSGradient(css: string): Gradient | null;
export declare function parseCSSConicGradient(
  css: string,
): ConicGradient | null;
export declare function parseCSSBoxShadow(css: string): BoxShadow[];
export declare function parseBorderRadius(
  s: CSSStyleDeclaration,
  el?: Element,
  dims?: {
    w: number;
    h: number;
  },
): BorderRadius | undefined;
export declare function clampRadiusToBox(
  radius: BorderRadius | undefined,
  w: number,
  h: number,
): BorderRadius | undefined;
export declare function insetBorderRadius(
  radius: BorderRadius | undefined,
  iT: number,
  iR: number,
  iB: number,
  iL: number,
): BorderRadius | undefined;
export declare function isTransparentColor(css: string): boolean;
export declare function pxToPt(s: string): number;
