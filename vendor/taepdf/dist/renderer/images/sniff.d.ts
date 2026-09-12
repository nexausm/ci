export type SniffedFormat =
  "jpeg" | "png" | "tiff" | "gif" | "bmp" | "ico" | "webp" | "avif" | "unknown";
export declare function sniffFormat(b: Uint8Array): SniffedFormat;
export declare function pngNeedsBrowserDecode(b: Uint8Array): boolean;
export declare function hasTrnsChunk(b: Uint8Array): boolean;
