import { type WalkerCtx } from "./types.js";
export declare function hasBorderImage(s: CSSStyleDeclaration): boolean;
export declare function emitBorderImage(
  el: Element,
  s: CSSStyleDeclaration,
  ctx: WalkerCtx,
): Promise<void>;
