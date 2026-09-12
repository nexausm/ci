// renderer/pdf_doc/crypto_r6.ts
import { sha256, sha384, sha512 } from "./sha2.js";
import { aesCbcEncrypt, aesEcbEncryptBlock } from "./aes.js";
var _te = new TextEncoder();
function concatBytes(...parts) {
  const total = parts.reduce((n, p) => n + p.length, 0);
  const out = new Uint8Array(total);
  let off = 0;
  for (const p of parts) {
    out.set(p, off);
    off += p.length;
  }
  return out;
}
function preparePassword(pw) {
  const b = _te.encode(pw);
  return b.length > 127 ? b.slice(0, 127) : b;
}
function randomBytes(n) {
  return crypto.getRandomValues(new Uint8Array(n));
}
function hardenedHash(password, salt, extra) {
  let k = sha256(concatBytes(password, salt, extra));
  let round = 0;
  for (;;) {
    const k1Unit = concatBytes(password, k, extra);
    const k1 = new Uint8Array(k1Unit.length * 64);
    for (let i = 0; i < 64; i++) k1.set(k1Unit, i * k1Unit.length);
    const aesKey = k.slice(0, 16);
    const iv = k.slice(16, 32);
    const e = aesCbcEncrypt(aesKey, iv, k1, false);
    let sum = 0;
    for (let i = 0; i < 16; i++) sum += e[i];
    const mod3 = sum % 3;
    k = mod3 === 0 ? sha256(e) : mod3 === 1 ? sha384(e) : sha512(e);
    round++;
    if (round >= 64 && e[e.length - 1] <= round - 32) break;
  }
  return k.slice(0, 32);
}
function computeR6Security(userPw, ownerPw, permissions) {
  const userPassword = preparePassword(userPw);
  const ownerPassword = preparePassword(ownerPw);
  const fileKey = randomBytes(32);
  const uValidationSalt = randomBytes(8);
  const uKeySalt = randomBytes(8);
  const uHash = hardenedHash(userPassword, uValidationSalt, new Uint8Array(0));
  const u = concatBytes(uHash, uValidationSalt, uKeySalt);
  const uIntermediateKey = hardenedHash(
    userPassword,
    uKeySalt,
    new Uint8Array(0),
  );
  const ue = aesCbcEncrypt(
    uIntermediateKey,
    new Uint8Array(16),
    fileKey,
    false,
  );
  const oValidationSalt = randomBytes(8);
  const oKeySalt = randomBytes(8);
  const oHash = hardenedHash(ownerPassword, oValidationSalt, u);
  const o = concatBytes(oHash, oValidationSalt, oKeySalt);
  const oIntermediateKey = hardenedHash(ownerPassword, oKeySalt, u);
  const oe = aesCbcEncrypt(
    oIntermediateKey,
    new Uint8Array(16),
    fileKey,
    false,
  );
  const permsBlock = new Uint8Array(16);
  new DataView(permsBlock.buffer).setUint32(0, permissions >>> 0, true);
  permsBlock[4] = 255;
  permsBlock[5] = 255;
  permsBlock[6] = 255;
  permsBlock[7] = 255;
  permsBlock[8] = 84;
  permsBlock[9] = 97;
  permsBlock[10] = 100;
  permsBlock[11] = 98;
  permsBlock.set(randomBytes(4), 12);
  const perms = aesEcbEncryptBlock(fileKey, permsBlock);
  return { fileKey, o, u, oe, ue, perms, permissions };
}
export { computeR6Security };
