export interface RawImage {
  width: number;
  height: number;
  colorSpace: "DeviceRGB" | "DeviceGray";
  data: Uint8Array;
  smask: Uint8Array | null;
}
export declare function clearDecodeCache(): void;
export declare function decodeToRaw(
  bytes: Uint8Array,
): Promise<RawImage | null>;
