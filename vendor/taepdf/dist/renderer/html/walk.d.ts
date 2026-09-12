import { type WalkerCtx } from "./types.js";
export declare function walkChildren(
  parent: Element,
  parentStyle: CSSStyleDeclaration,
  ctx: WalkerCtx,
): Promise<void>;
