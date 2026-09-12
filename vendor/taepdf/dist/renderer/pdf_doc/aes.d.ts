export declare function aesCbcEncrypt(
  key: Uint8Array,
  iv: Uint8Array,
  data: Uint8Array,
  pad: boolean,
): Uint8Array;
export declare function aesEcbEncryptBlock(
  key: Uint8Array,
  block: Uint8Array,
): Uint8Array;
