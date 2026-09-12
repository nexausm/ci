import type { Gradient } from "../types/index.js";
import { type WalkerCtx } from "./types.js";
export declare function resolveGradientBox(
  gradient: Gradient,
  w: number,
  h: number,
): Gradient;
export declare function emitBox(
  el: Element,
  s: CSSStyleDeclaration,
  ctx: WalkerCtx,
): void;
export declare function captureVerticalTextNode(
  textNode: Text,
  parentEl: Element,
  s: CSSStyleDeclaration,
  ctx: WalkerCtx,
): void;
export declare function captureTextNode(
  textNode: Text,
  parentEl: Element,
  s: CSSStyleDeclaration,
  ctx: WalkerCtx,
): void;
export declare function emitListMarker(
  el: Element,
  s: CSSStyleDeclaration,
  ctx: WalkerCtx,
): void;
export declare function emitLinks(el: HTMLAnchorElement, ctx: WalkerCtx): void;
export declare function emitFormField(
  el: Element,
  s: CSSStyleDeclaration,
  ctx: WalkerCtx,
): void;
export declare function captureAnchor(el: Element, ctx: WalkerCtx): void;
export declare function capturePseudo(
  el: Element,
  which: "::before" | "::after",
  ctx: WalkerCtx,
): Promise<void>;
