import type { PathSeg, Color, ColorAlpha, Gradient } from "../types/index.js";
export interface VectorShape {
  ops: PathSeg[];
  evenOdd: boolean;
  fill?: Color;
  stroke?: Color;
  strokeWidth?: number;
  dashArray?: number[];
  lineCap?: number;
  lineJoin?: number;
  gradient?: Gradient;
  gradientBox?: {
    x: number;
    y: number;
    w: number;
    h: number;
  };
  opacity?: number;
}
export declare function svgToVectorShapes(
  svgStr: string,
  boxX: number,
  boxY: number,
  boxW: number,
  boxH: number,
  currentColor?: ColorAlpha,
): VectorShape[] | null;
