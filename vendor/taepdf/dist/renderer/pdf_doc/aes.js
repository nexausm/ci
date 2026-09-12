// renderer/pdf_doc/aes.ts
function gmul(a, b) {
  let p = 0;
  for (let i = 0; i < 8; i++) {
    if (b & 1) p ^= a;
    const hi = a & 128;
    a = (a << 1) & 255;
    if (hi) a ^= 27;
    b >>= 1;
  }
  return p;
}
function gf256Inverse(a) {
  if (a === 0) return 0;
  for (let x = 1; x < 256; x++) if (gmul(a, x) === 1) return x;
  return 0;
}
function affineTransform(b) {
  let out = 0;
  for (let i = 0; i < 8; i++) {
    const bit =
      ((b >> i) & 1) ^
      ((b >> ((i + 4) % 8)) & 1) ^
      ((b >> ((i + 5) % 8)) & 1) ^
      ((b >> ((i + 6) % 8)) & 1) ^
      ((b >> ((i + 7) % 8)) & 1) ^
      ((99 >> i) & 1);
    out |= bit << i;
  }
  return out;
}
var SBOX = new Uint8Array(256);
for (let i = 0; i < 256; i++) SBOX[i] = affineTransform(gf256Inverse(i));
var RCON = new Uint8Array(15);
{
  let r = 1;
  for (let i = 1; i <= 14; i++) {
    RCON[i] = r;
    r = gmul(r, 2);
  }
}
function subWord(w) {
  return (
    (SBOX[(w >>> 24) & 255] << 24) |
    (SBOX[(w >>> 16) & 255] << 16) |
    (SBOX[(w >>> 8) & 255] << 8) |
    SBOX[w & 255]
  );
}
function rotWord(w) {
  return ((w << 8) | (w >>> 24)) >>> 0;
}
function keyExpansion(key, nk, nr) {
  const nb = 4;
  const w = new Uint32Array(nb * (nr + 1));
  const view = new DataView(key.buffer, key.byteOffset, key.byteLength);
  for (let i = 0; i < nk; i++) w[i] = view.getUint32(i * 4, false);
  for (let i = nk; i < w.length; i++) {
    let temp = w[i - 1];
    if (i % nk === 0) {
      temp = (subWord(rotWord(temp)) ^ (RCON[i / nk] << 24)) >>> 0;
    } else if (nk > 6 && i % nk === 4) {
      temp = subWord(temp);
    }
    w[i] = (w[i - nk] ^ temp) >>> 0;
  }
  return w;
}
function addRoundKey(state, w, round) {
  for (let c = 0; c < 4; c++) {
    const word = w[round * 4 + c];
    state[c * 4 + 0] ^= (word >>> 24) & 255;
    state[c * 4 + 1] ^= (word >>> 16) & 255;
    state[c * 4 + 2] ^= (word >>> 8) & 255;
    state[c * 4 + 3] ^= word & 255;
  }
}
function subBytes(state) {
  for (let i = 0; i < 16; i++) state[i] = SBOX[state[i]];
}
function shiftRows(state) {
  const s = state.slice();
  for (let r = 1; r < 4; r++) {
    for (let c = 0; c < 4; c++) {
      state[c * 4 + r] = s[((c + r) % 4) * 4 + r];
    }
  }
}
function mixColumns(state) {
  for (let c = 0; c < 4; c++) {
    const a0 = state[c * 4],
      a1 = state[c * 4 + 1],
      a2 = state[c * 4 + 2],
      a3 = state[c * 4 + 3];
    state[c * 4 + 0] = gmul(a0, 2) ^ gmul(a1, 3) ^ a2 ^ a3;
    state[c * 4 + 1] = a0 ^ gmul(a1, 2) ^ gmul(a2, 3) ^ a3;
    state[c * 4 + 2] = a0 ^ a1 ^ gmul(a2, 2) ^ gmul(a3, 3);
    state[c * 4 + 3] = gmul(a0, 3) ^ a1 ^ a2 ^ gmul(a3, 2);
  }
}
var cachedKey = null;
var cachedSchedule = null;
var cachedNr = 0;
function scheduleFor(key) {
  if (cachedKey !== key) {
    const nk = key.length / 4;
    cachedNr = nk + 6;
    cachedSchedule = keyExpansion(key, nk, cachedNr);
    cachedKey = key;
  }
  return { w: cachedSchedule, nr: cachedNr };
}
function encryptBlock(block, key) {
  const { w, nr } = scheduleFor(key);
  const state = block.slice();
  addRoundKey(state, w, 0);
  for (let round = 1; round < nr; round++) {
    subBytes(state);
    shiftRows(state);
    mixColumns(state);
    addRoundKey(state, w, round);
  }
  subBytes(state);
  shiftRows(state);
  addRoundKey(state, w, nr);
  block.set(state);
}
function xorInto(a, b) {
  for (let i = 0; i < a.length; i++) a[i] ^= b[i];
}
function pkcs7Pad(data) {
  const padLen = 16 - (data.length % 16);
  const out = new Uint8Array(data.length + padLen);
  out.set(data);
  out.fill(padLen, data.length);
  return out;
}
function aesCbcEncrypt(key, iv, data, pad) {
  const input = pad ? pkcs7Pad(data) : data;
  const out = new Uint8Array(input.length);
  let prev = iv.slice();
  for (let off = 0; off < input.length; off += 16) {
    const block = input.slice(off, off + 16);
    xorInto(block, prev);
    encryptBlock(block, key);
    out.set(block, off);
    prev = block;
  }
  return out;
}
function aesEcbEncryptBlock(key, block) {
  const out = block.slice();
  encryptBlock(out, key);
  return out;
}
export { aesCbcEncrypt, aesEcbEncryptBlock };
