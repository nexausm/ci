import initEngine, {
  measure_string_width,
  list_registered_fonts,
} from "./taetype/taetype.js";
export { initEngine, measure_string_width, list_registered_fonts };
export declare const PAGE_A4: {
  readonly width: 595.28;
  readonly height: 841.89;
};
export declare const PAGE_A5: {
  readonly width: 419.53;
  readonly height: 595.28;
};
export declare const PAGE_LETTER: {
  readonly width: 612;
  readonly height: 792;
};
export type ManifestEntry = {
  path: string;
  name: string;
  ttcIndex?: number;
};
export declare function loadAndRegisterFont(
  entry: ManifestEntry,
): Promise<void>;
export declare function triggerDownload(
  bytes: Uint8Array,
  fileName: string,
): void;
export declare const safeName: (s: string) => string;
