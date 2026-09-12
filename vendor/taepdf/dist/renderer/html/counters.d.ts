export type CounterMap = Map<string, number[]>;
export declare function applyCounters(
  counters: CounterMap,
  s: CSSStyleDeclaration,
): string[];
export declare function popCounters(
  counters: CounterMap,
  pushed: string[],
): void;
export declare function romanNumeral(n: number): string;
export declare function alphaLabel(n: number): string;
export declare function counterText(n: number, style?: string): string;
export declare function resolveContentList(
  content: string,
  counters: CounterMap,
): string | null;
