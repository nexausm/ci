import { type WalkerCtx } from "./types.js";
export declare function invalidateImageCache(): void;
export declare function extractBgUrl(layer: string): string | null;
export declare function emitImage(
  el: HTMLImageElement,
  ctx: WalkerCtx,
): Promise<void>;
export declare function emitCanvas(el: HTMLCanvasElement, ctx: WalkerCtx): void;
export declare function emitInlineSVG(
  el: SVGSVGElement,
  ctx: WalkerCtx,
): Promise<void>;
export declare function emitBgImage(
  el: Element,
  srcUrl: string,
  ctx: WalkerCtx,
  layerIndex?: number,
  layerCount?: number,
): Promise<void>;
