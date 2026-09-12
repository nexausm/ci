import type {
  DrawCommand,
  DocDefinition,
  AnchorEntry,
  StructNode,
} from "../types/index.js";
export { rasterizeSVGs } from "./svg.js";
export declare function applyToPDF(
  commands: DrawCommand[],
  def: DocDefinition,
  anchors?: Map<string, AnchorEntry>,
  structRoot?: StructNode,
): Uint8Array;
