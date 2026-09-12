import type {
  Color,
  Gradient,
  BorderRadius,
  Corner,
  BoxShadow,
} from "./color.js";
import type { RawImage } from "../images/decode.js";
export interface TextCommand {
  type: "text";
  page: number;
  text: string;
  x: number;
  y: number;
  font: string;
  style: string;
  weight: number;
  size: number;
  color: Color;
  align: "left" | "center" | "right";
  maxWidth: number;
  opacity?: number;
  letterSpacing?: number;
  wordSpacing?: number;
  direction?: "ltr" | "rtl";
  stroke?: Color;
  strokeWidth?: number;
  strokeOnly?: boolean;
  blend?: string;
  vertical?: boolean;
  mcid?: number;
  structTag?: string;
}
export interface LinkCommand {
  type: "link";
  page: number;
  x: number;
  y: number;
  w: number;
  h: number;
  href: string;
}
export interface RectCommand {
  type: "rect";
  page: number;
  x: number;
  y: number;
  w: number;
  h: number;
  fill?: Color | null;
  gradient?: Gradient;
  stroke?: Color | null;
  strokeWidth?: number;
  strokeStyle?: "solid" | "dashed" | "dotted";
  radius?: BorderRadius;
  shadow?: BoxShadow[];
  opacity?: number;
  blend?: string;
}
export interface LineCommand {
  type: "line";
  page: number;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  width: number;
  color: Color;
  lineStyle?: "solid" | "dashed" | "dotted" | "wavy";
  opacity?: number;
  blend?: string;
}
export interface PathSeg {
  op: "m" | "l" | "c";
  args: number[];
}
export interface ClipCommand {
  type: "clip-push" | "clip-pop";
  page: number;
  x?: number;
  y?: number;
  w?: number;
  h?: number;
  radius?: BorderRadius;
  path?: PathSeg[];
  evenOdd?: boolean;
}
export interface ImageCommand {
  type: "image";
  page: number;
  src: Uint8Array;
  format: "png" | "jpg" | "svg";
  x: number;
  y: number;
  w: number;
  h: number;
  opacity?: number;
  blend?: string;
  mcid?: number;
  structTag?: string;
}
export interface RawImageCommand {
  type: "raw-image";
  page: number;
  raw: RawImage;
  x: number;
  y: number;
  w: number;
  h: number;
  opacity?: number;
  blend?: string;
  mcid?: number;
  structTag?: string;
}
export interface TransformCommand {
  type: "transform-push" | "transform-pop";
  page: number;
  matrix?: number[];
}
export interface FieldCommand {
  type: "field";
  page: number;
  x: number;
  y: number;
  w: number;
  h: number;
  fieldType: "Tx" | "Btn" | "Ch";
  name: string;
  font: string;
  style: string;
  weight: number;
  size: number;
  color: Color;
  value?: string;
  checked?: boolean;
  options?: string[];
}
export interface PathCommand {
  type: "path";
  page: number;
  ops: PathSeg[];
  evenOdd?: boolean;
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
  blend?: string;
}
export type DrawCommand =
  | TextCommand
  | RectCommand
  | LineCommand
  | ClipCommand
  | LinkCommand
  | ImageCommand
  | RawImageCommand
  | TransformCommand
  | FieldCommand
  | PathCommand;
export interface ResolvedRadius {
  tl: Corner;
  tr: Corner;
  br: Corner;
  bl: Corner;
}
export declare function resolveRadius(
  r: BorderRadius | undefined,
): ResolvedRadius;
export declare function anyRadius(rr: ResolvedRadius): boolean;
