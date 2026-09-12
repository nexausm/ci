import { type WalkerCtx } from "./types.js";
export declare function hasMask(s: CSSStyleDeclaration): boolean;
export declare function emitMaskedElement(
  el: Element,
  s: CSSStyleDeclaration,
  ctx: WalkerCtx,
): Promise<void>;
