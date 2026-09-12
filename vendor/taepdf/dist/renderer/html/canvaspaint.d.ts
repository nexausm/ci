export declare function paintNode(
  node: Element,
  c: CanvasRenderingContext2D,
  rootRect: DOMRect,
  dpr: number,
): void;
export declare function canvasToPngBytes(
  canvas: HTMLCanvasElement,
): Uint8Array | null;
