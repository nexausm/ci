export type PageSize =
  | "A3"
  | "A4"
  | "A5"
  | "Letter"
  | "Legal"
  | "Tabloid"
  | {
      width: number;
      height: number;
    };
export interface PageConfig {
  size: PageSize;
  orientation?: "portrait" | "landscape";
}
export declare function resolvePageSize(
  size: PageSize,
  orientation?: "portrait" | "landscape",
): {
  width: number;
  height: number;
};
