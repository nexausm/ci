export declare const _te: TextEncoder;
export declare function hpf(n: number): string;
export declare function encodeColor(
  r: number,
  g: number,
  b: number,
  isStroke: boolean,
  prec?: number,
): string;
export declare function toPdfName(s: string): string;
export declare function pdfEscape(s: string): string;
export declare function widthsToPdf(widths: [number, number][]): string;
export declare function w2ToPdf(
  entries: [number, number, number, number][],
): string;
export declare function bboxToPdf(bbox: number[]): string;
export declare function bytesToHex(bytes: Uint8Array): string;
export declare function pdfDate(): string;
