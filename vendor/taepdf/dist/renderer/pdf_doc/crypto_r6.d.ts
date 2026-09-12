export interface R6Security {
  fileKey: Uint8Array;
  o: Uint8Array;
  u: Uint8Array;
  oe: Uint8Array;
  ue: Uint8Array;
  perms: Uint8Array;
  permissions: number;
}
export declare function computeR6Security(
  userPw: string,
  ownerPw: string,
  permissions: number,
): R6Security;
