/* tslint:disable */
/* eslint-disable */

export function decompress_brotli(compressed: Uint8Array): Uint8Array;

export function font_has_glyph(
  font_name: string,
  style: string,
  codepoint: number,
): boolean;

export function get_advance_widths(
  font_name: string,
  style: string,
  weight: number,
  opsz: number,
  glyph_ids: Uint16Array,
): Float64Array;

export function get_colr_layers(
  font_name: string,
  style: string,
  gid: number,
): Uint32Array;

export function get_compressed_range(woff2_bytes: Uint8Array): any;

export function get_glyph_bitmap(
  font_name: string,
  style: string,
  gid: number,
  target_ppem: number,
): any;

export function get_glyph_ids(
  text: string,
  font_name: string,
  style: string,
  weight: number,
): Uint16Array;

export function get_vertical_advance(
  font_name: string,
  style: string,
  weight: number,
  opsz: number,
  gid: number,
): number;

export function list_registered_fonts(): Array<any>;

export function measure_string_width(
  text: string,
  font_name: string,
  style: string,
  weight: number,
  opsz: number,
  font_size: number,
): number;

export function read_font_meta(
  woff2_bytes: Uint8Array,
  decompressed: Uint8Array,
  index: number,
): any;

export function register_font(
  name: string,
  style: string,
  weight: number,
  opsz: number,
  woff2_bytes: Uint8Array,
  decompressed: Uint8Array,
  index: number,
): void;

export function register_font_raw(name: string, raw_bytes: Uint8Array): void;

export function register_font_ttc(
  name: string,
  ttc_bytes: Uint8Array,
  index: number,
): void;

export function shape_text(
  text: string,
  font_name: string,
  style: string,
  weight: number,
  opsz: number,
  vertical: boolean,
): any;

export function subset_font_full(
  font_name: string,
  style: string,
  weight: number,
  opsz: number,
  glyph_ids: Uint16Array,
): any;

export function ttc_font_count(bytes: Uint8Array): number;

export type InitInput =
  RequestInfo | URL | Response | BufferSource | WebAssembly.Module;

export interface InitOutput {
  readonly memory: WebAssembly.Memory;
  readonly decompress_brotli: (a: number, b: number, c: number) => void;
  readonly font_has_glyph: (
    a: number,
    b: number,
    c: number,
    d: number,
    e: number,
  ) => number;
  readonly get_advance_widths: (
    a: number,
    b: number,
    c: number,
    d: number,
    e: number,
    f: number,
    g: number,
    h: number,
  ) => number;
  readonly get_colr_layers: (
    a: number,
    b: number,
    c: number,
    d: number,
    e: number,
  ) => number;
  readonly get_compressed_range: (a: number, b: number, c: number) => void;
  readonly get_glyph_bitmap: (
    a: number,
    b: number,
    c: number,
    d: number,
    e: number,
    f: number,
  ) => number;
  readonly get_glyph_ids: (
    a: number,
    b: number,
    c: number,
    d: number,
    e: number,
    f: number,
    g: number,
  ) => number;
  readonly get_vertical_advance: (
    a: number,
    b: number,
    c: number,
    d: number,
    e: number,
    f: number,
    g: number,
  ) => number;
  readonly list_registered_fonts: () => number;
  readonly measure_string_width: (
    a: number,
    b: number,
    c: number,
    d: number,
    e: number,
    f: number,
    g: number,
    h: number,
    i: number,
  ) => number;
  readonly read_font_meta: (
    a: number,
    b: number,
    c: number,
    d: number,
    e: number,
    f: number,
  ) => void;
  readonly register_font: (
    a: number,
    b: number,
    c: number,
    d: number,
    e: number,
    f: number,
    g: number,
    h: number,
    i: number,
    j: number,
    k: number,
    l: number,
  ) => void;
  readonly register_font_raw: (
    a: number,
    b: number,
    c: number,
    d: number,
    e: number,
  ) => void;
  readonly register_font_ttc: (
    a: number,
    b: number,
    c: number,
    d: number,
    e: number,
    f: number,
  ) => void;
  readonly shape_text: (
    a: number,
    b: number,
    c: number,
    d: number,
    e: number,
    f: number,
    g: number,
    h: number,
    i: number,
  ) => number;
  readonly subset_font_full: (
    a: number,
    b: number,
    c: number,
    d: number,
    e: number,
    f: number,
    g: number,
    h: number,
  ) => number;
  readonly ttc_font_count: (a: number, b: number) => number;
  readonly __wbindgen_export: (a: number, b: number) => number;
  readonly __wbindgen_export2: (
    a: number,
    b: number,
    c: number,
    d: number,
  ) => number;
  readonly __wbindgen_export3: (a: number) => void;
  readonly __wbindgen_add_to_stack_pointer: (a: number) => number;
  readonly __wbindgen_export4: (a: number, b: number, c: number) => void;
}

export type SyncInitInput = BufferSource | WebAssembly.Module;

/**
 * Instantiates the given `module`, which can either be bytes or
 * a precompiled `WebAssembly.Module`.
 *
 * @param {{ module: SyncInitInput }} module - Passing `SyncInitInput` directly is deprecated.
 *
 * @returns {InitOutput}
 */
export function initSync(
  module: { module: SyncInitInput } | SyncInitInput,
): InitOutput;

/**
 * If `module_or_path` is {RequestInfo} or {URL}, makes a request and
 * for everything else, calls `WebAssembly.instantiate` directly.
 *
 * @param {{ module_or_path: InitInput | Promise<InitInput> }} module_or_path - Passing `InitInput` directly is deprecated.
 *
 * @returns {Promise<InitOutput>}
 */
export default function __wbg_init(
  module_or_path?:
    | { module_or_path: InitInput | Promise<InitInput> }
    | InitInput
    | Promise<InitInput>,
): Promise<InitOutput>;
