import type { InternalCtx } from "./types.js";
export declare function putCatalog(
  ctx: InternalCtx,
  structTreeRootId: number | null,
  pdfaExtras: {
    outputIntentId: number;
    metadataId: number;
  } | null,
): number;
export declare function putEncryptDict(ctx: InternalCtx): number | null;
export declare function buildXrefStream(
  ctx: InternalCtx,
  catalogId: number,
  encryptId: number | null,
  infoId: number,
): void;
