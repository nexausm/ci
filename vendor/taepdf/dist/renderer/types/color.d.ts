export type Color = [number, number, number];
export type ColorAlpha = [number, number, number, number];
export interface Corner {
  h: number;
  v: number;
}
export interface BorderRadius {
  all?: number;
  topLeft?: Corner;
  topRight?: Corner;
  bottomRight?: Corner;
  bottomLeft?: Corner;
}
export interface BoxShadow {
  x: number;
  y: number;
  blur: number;
  spread?: number;
  color: ColorAlpha;
  inset?: boolean;
}
export interface GradientStop {
  color: ColorAlpha;
  position: number;
  posPx?: number;
}
export type Gradient =
  | {
      type: "linear";
      angle: number;
      corner?: string;
      repeating?: boolean;
      stops: GradientStop[];
    }
  | {
      type: "radial";
      cx?: number;
      cy?: number;
      fx?: number;
      fy?: number;
      radius?: number;
      repeating?: boolean;
      stops: GradientStop[];
    };
export interface ConicGradient {
  fromDeg: number;
  cx: number;
  cy: number;
  repeating?: boolean;
  stops: GradientStop[];
}
