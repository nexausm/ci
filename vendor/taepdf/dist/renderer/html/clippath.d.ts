import type { BorderRadius, PathSeg } from "../types/index.js";
export type ClipShape =
  | {
      kind: "rect";
      x: number;
      y: number;
      w: number;
      h: number;
      radius?: BorderRadius;
    }
  | {
      kind: "path";
      ops: PathSeg[];
      evenOdd: boolean;
    };
export declare function parseSvgPath(d: string): PathSeg[];
export declare function parseClipPath(
  value: string,
  box: {
    x: number;
    y: number;
    w: number;
    h: number;
  },
): ClipShape | null;
