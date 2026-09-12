// node_modules/fflate/esm/browser.js
var u8 = Uint8Array;
var u16 = Uint16Array;
var i32 = Int32Array;
var fleb = new u8([
  0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 2, 2, 2, 2, 3, 3, 3, 3, 4, 4, 4, 4, 5, 5,
  5, 5, 0 /* unused */, 0, 0 /* impossible */, 0,
]);
var fdeb = new u8([
  0, 0, 0, 0, 1, 1, 2, 2, 3, 3, 4, 4, 5, 5, 6, 6, 7, 7, 8, 8, 9, 9, 10, 10, 11,
  11, 12, 12, 13, 13 /* unused */, 0, 0,
]);
var clim = new u8([
  16, 17, 18, 0, 8, 7, 9, 6, 10, 5, 11, 4, 12, 3, 13, 2, 14, 1, 15,
]);
var freb = function (eb, start) {
  var b = new u16(31);
  for (var i2 = 0; i2 < 31; ++i2) {
    b[i2] = start += 1 << eb[i2 - 1];
  }
  var r = new i32(b[30]);
  for (var i2 = 1; i2 < 30; ++i2) {
    for (var j = b[i2]; j < b[i2 + 1]; ++j) {
      r[j] = ((j - b[i2]) << 5) | i2;
    }
  }
  return { b, r };
};
var _a = freb(fleb, 2);
var fl = _a.b;
var revfl = _a.r;
((fl[28] = 258), (revfl[258] = 28));
var _b = freb(fdeb, 0);
var fd = _b.b;
var revfd = _b.r;
var rev = new u16(32768);
for (i = 0; i < 32768; ++i) {
  x = ((i & 43690) >> 1) | ((i & 21845) << 1);
  x = ((x & 52428) >> 2) | ((x & 13107) << 2);
  x = ((x & 61680) >> 4) | ((x & 3855) << 4);
  rev[i] = (((x & 65280) >> 8) | ((x & 255) << 8)) >> 1;
}
var x;
var i;
var hMap = function (cd, mb, r) {
  var s = cd.length;
  var i2 = 0;
  var l = new u16(mb);
  for (; i2 < s; ++i2) {
    if (cd[i2]) ++l[cd[i2] - 1];
  }
  var le = new u16(mb);
  for (i2 = 1; i2 < mb; ++i2) {
    le[i2] = (le[i2 - 1] + l[i2 - 1]) << 1;
  }
  var co;
  if (r) {
    co = new u16(1 << mb);
    var rvb = 15 - mb;
    for (i2 = 0; i2 < s; ++i2) {
      if (cd[i2]) {
        var sv = (i2 << 4) | cd[i2];
        var r_1 = mb - cd[i2];
        var v = le[cd[i2] - 1]++ << r_1;
        for (var m = v | ((1 << r_1) - 1); v <= m; ++v) {
          co[rev[v] >> rvb] = sv;
        }
      }
    }
  } else {
    co = new u16(s);
    for (i2 = 0; i2 < s; ++i2) {
      if (cd[i2]) {
        co[i2] = rev[le[cd[i2] - 1]++] >> (15 - cd[i2]);
      }
    }
  }
  return co;
};
var flt = new u8(288);
for (i = 0; i < 144; ++i) flt[i] = 8;
var i;
for (i = 144; i < 256; ++i) flt[i] = 9;
var i;
for (i = 256; i < 280; ++i) flt[i] = 7;
var i;
for (i = 280; i < 288; ++i) flt[i] = 8;
var i;
var fdt = new u8(32);
for (i = 0; i < 32; ++i) fdt[i] = 5;
var i;
var flrm = /* @__PURE__ */ hMap(flt, 9, 1);
var fdrm = /* @__PURE__ */ hMap(fdt, 5, 1);
var max = function (a) {
  var m = a[0];
  for (var i2 = 1; i2 < a.length; ++i2) {
    if (a[i2] > m) m = a[i2];
  }
  return m;
};
var bits = function (d, p, m) {
  var o = (p / 8) | 0;
  return ((d[o] | (d[o + 1] << 8)) >> (p & 7)) & m;
};
var bits16 = function (d, p) {
  var o = (p / 8) | 0;
  return (d[o] | (d[o + 1] << 8) | (d[o + 2] << 16)) >> (p & 7);
};
var shft = function (p) {
  return ((p + 7) / 8) | 0;
};
var slc = function (v, s, e) {
  if (s == null || s < 0) s = 0;
  if (e == null || e > v.length) e = v.length;
  return new u8(v.subarray(s, e));
};
var ec = [
  "unexpected EOF",
  "invalid block type",
  "invalid length/literal",
  "invalid distance",
  "stream finished",
  "no stream handler",
  ,
  // determined by compression function
  "no callback",
  "invalid UTF-8 data",
  "extra field too long",
  "date not in range 1980-2099",
  "filename too long",
  "stream finishing",
  "invalid zip data",
  // determined by unknown compression method
];
var err = function (ind, msg, nt) {
  var e = new Error(msg || ec[ind]);
  e.code = ind;
  if (Error.captureStackTrace) Error.captureStackTrace(e, err);
  if (!nt) throw e;
  return e;
};
var inflt = function (dat, st, buf, dict) {
  var sl = dat.length,
    dl = dict ? dict.length : 0;
  if (!sl || (st.f && !st.l)) return buf || new u8(0);
  var noBuf = !buf;
  var resize = noBuf || st.i != 2;
  var noSt = st.i;
  if (noBuf) buf = new u8(sl * 3);
  var cbuf = function (l2) {
    var bl = buf.length;
    if (l2 > bl) {
      var nbuf = new u8(Math.max(bl * 2, l2));
      nbuf.set(buf);
      buf = nbuf;
    }
  };
  var final = st.f || 0,
    pos = st.p || 0,
    bt = st.b || 0,
    lm = st.l,
    dm = st.d,
    lbt = st.m,
    dbt = st.n;
  var tbts = sl * 8;
  do {
    if (!lm) {
      final = bits(dat, pos, 1);
      var type = bits(dat, pos + 1, 3);
      pos += 3;
      if (!type) {
        var s = shft(pos) + 4,
          l = dat[s - 4] | (dat[s - 3] << 8),
          t = s + l;
        if (t > sl) {
          if (noSt) err(0);
          break;
        }
        if (resize) cbuf(bt + l);
        buf.set(dat.subarray(s, t), bt);
        ((st.b = bt += l), (st.p = pos = t * 8), (st.f = final));
        continue;
      } else if (type == 1) ((lm = flrm), (dm = fdrm), (lbt = 9), (dbt = 5));
      else if (type == 2) {
        var hLit = bits(dat, pos, 31) + 257,
          hcLen = bits(dat, pos + 10, 15) + 4;
        var tl = hLit + bits(dat, pos + 5, 31) + 1;
        pos += 14;
        var ldt = new u8(tl);
        var clt = new u8(19);
        for (var i2 = 0; i2 < hcLen; ++i2) {
          clt[clim[i2]] = bits(dat, pos + i2 * 3, 7);
        }
        pos += hcLen * 3;
        var clb = max(clt),
          clbmsk = (1 << clb) - 1;
        var clm = hMap(clt, clb, 1);
        for (var i2 = 0; i2 < tl;) {
          var r = clm[bits(dat, pos, clbmsk)];
          pos += r & 15;
          var s = r >> 4;
          if (s < 16) {
            ldt[i2++] = s;
          } else {
            var c = 0,
              n = 0;
            if (s == 16)
              ((n = 3 + bits(dat, pos, 3)), (pos += 2), (c = ldt[i2 - 1]));
            else if (s == 17) ((n = 3 + bits(dat, pos, 7)), (pos += 3));
            else if (s == 18) ((n = 11 + bits(dat, pos, 127)), (pos += 7));
            while (n--) ldt[i2++] = c;
          }
        }
        var lt = ldt.subarray(0, hLit),
          dt = ldt.subarray(hLit);
        lbt = max(lt);
        dbt = max(dt);
        lm = hMap(lt, lbt, 1);
        dm = hMap(dt, dbt, 1);
      } else err(1);
      if (pos > tbts) {
        if (noSt) err(0);
        break;
      }
    }
    if (resize) cbuf(bt + 131072);
    var lms = (1 << lbt) - 1,
      dms = (1 << dbt) - 1;
    var lpos = pos;
    for (; ; lpos = pos) {
      var c = lm[bits16(dat, pos) & lms],
        sym = c >> 4;
      pos += c & 15;
      if (pos > tbts) {
        if (noSt) err(0);
        break;
      }
      if (!c) err(2);
      if (sym < 256) buf[bt++] = sym;
      else if (sym == 256) {
        ((lpos = pos), (lm = null));
        break;
      } else {
        var add = sym - 254;
        if (sym > 264) {
          var i2 = sym - 257,
            b = fleb[i2];
          add = bits(dat, pos, (1 << b) - 1) + fl[i2];
          pos += b;
        }
        var d = dm[bits16(dat, pos) & dms],
          dsym = d >> 4;
        if (!d) err(3);
        pos += d & 15;
        var dt = fd[dsym];
        if (dsym > 3) {
          var b = fdeb[dsym];
          ((dt += bits16(dat, pos) & ((1 << b) - 1)), (pos += b));
        }
        if (pos > tbts) {
          if (noSt) err(0);
          break;
        }
        if (resize) cbuf(bt + 131072);
        var end = bt + add;
        if (bt < dt) {
          var shift = dl - dt,
            dend = Math.min(dt, end);
          if (shift + bt < 0) err(3);
          for (; bt < dend; ++bt) buf[bt] = dict[shift + bt];
        }
        for (; bt < end; ++bt) buf[bt] = buf[bt - dt];
      }
    }
    ((st.l = lm), (st.p = lpos), (st.b = bt), (st.f = final));
    if (lm) ((final = 1), (st.m = lbt), (st.d = dm), (st.n = dbt));
  } while (!final);
  return bt != buf.length && noBuf ? slc(buf, 0, bt) : buf.subarray(0, bt);
};
var et = /* @__PURE__ */ new u8(0);
var zls = function (d, dict) {
  if ((d[0] & 15) != 8 || d[0] >> 4 > 7 || ((d[0] << 8) | d[1]) % 31)
    err(6, "invalid zlib data");
  if (((d[1] >> 5) & 1) == +!dict)
    err(
      6,
      "invalid zlib data: " +
        (d[1] & 32 ? "need" : "unexpected") +
        " dictionary",
    );
  return ((d[1] >> 3) & 4) + 2;
};
function unzlibSync(data, opts) {
  return inflt(
    data.subarray(zls(data, opts && opts.dictionary), -4),
    { i: 2 },
    opts && opts.out,
    opts && opts.dictionary,
  );
}
var td = typeof TextDecoder != "undefined" && /* @__PURE__ */ new TextDecoder();
var tds = 0;
try {
  td.decode(et, { stream: true });
  tds = 1;
} catch (e) {}

// renderer/images/parse.ts
import { forEachChunk } from "./pngchunks.js";
import { hasTrnsChunk } from "./sniff.js";
function parseImage(bytes) {
  if (bytes.length >= 2 && bytes[0] === 255 && bytes[1] === 216)
    return parseJpeg(bytes);
  return parsePng(bytes);
}
function matchAscii(b, o, s) {
  if (o + s.length > b.length) return false;
  for (let k = 0; k < s.length; k++)
    if (b[o + k] !== s.charCodeAt(k)) return false;
  return true;
}
function isSofMarker(m) {
  return (
    m === 192 ||
    m === 193 ||
    m === 194 ||
    m === 195 ||
    m === 197 ||
    m === 198 ||
    m === 199 ||
    m === 201 ||
    m === 202 ||
    m === 203 ||
    m === 205 ||
    m === 206 ||
    m === 207
  );
}
function exifOrientation(tiff) {
  let le;
  if (tiff.length >= 2 && tiff[0] === 73 && tiff[1] === 73) le = true;
  else if (tiff.length >= 2 && tiff[0] === 77 && tiff[1] === 77) le = false;
  else return null;
  const u162 = (o) => {
    if (o + 2 > tiff.length) return null;
    return le ? tiff[o] | (tiff[o + 1] << 8) : (tiff[o] << 8) | tiff[o + 1];
  };
  const u32 = (o) => {
    if (o + 4 > tiff.length) return null;
    const b0 = tiff[o],
      b1 = tiff[o + 1],
      b2 = tiff[o + 2],
      b3 = tiff[o + 3];
    return le
      ? ((b3 << 24) | (b2 << 16) | (b1 << 8) | b0) >>> 0
      : ((b0 << 24) | (b1 << 16) | (b2 << 8) | b3) >>> 0;
  };
  if (u162(2) !== 42) return null;
  const ifd0 = u32(4);
  if (ifd0 === null) return null;
  const count = u162(ifd0);
  if (count === null) return null;
  for (let e = 0; e < Math.min(count, 512); e++) {
    const entry = ifd0 + 2 + e * 12;
    const tag = u162(entry);
    if (tag === null) return null;
    if (tag === 274) {
      const v = u162(entry + 8);
      return v !== null && v >= 1 && v <= 8 ? v : null;
    }
  }
  return null;
}
function parseJpeg(bytes) {
  const dims = parseJpegDims(bytes);
  if (!dims) return null;
  return {
    width: dims.width,
    height: dims.height,
    colorSpace: dims.colorSpace,
    data: bytes,
    smask: null,
    isJpeg: true,
    decodeInvert: dims.invert,
    orientation: dims.orientation,
  };
}
function parseJpegDims(bytes) {
  if (bytes.length < 4 || bytes[0] !== 255 || bytes[1] !== 216) return null;
  let i2 = 2;
  let adobe = false;
  let orientation = 1;
  while (i2 + 3 < bytes.length) {
    if (bytes[i2] !== 255) return null;
    while (i2 + 1 < bytes.length && bytes[i2 + 1] === 255) i2++;
    if (i2 + 3 >= bytes.length) return null;
    const marker = bytes[i2 + 1];
    i2 += 2;
    if (marker === 217 || (marker >= 208 && marker <= 215) || marker === 1)
      continue;
    if (i2 + 1 >= bytes.length) return null;
    const segLen = (bytes[i2] << 8) | bytes[i2 + 1];
    if (segLen < 2) return null;
    if (marker === 238 && matchAscii(bytes, i2 + 2, "Adobe")) adobe = true;
    if (
      marker === 225 &&
      segLen >= 8 &&
      matchAscii(bytes, i2 + 2, "Exif\0\0")
    ) {
      const o = exifOrientation(
        bytes.subarray(i2 + 8, Math.min(i2 + segLen, bytes.length)),
      );
      if (o !== null) orientation = o;
    }
    if (isSofMarker(marker) && i2 + 8 < bytes.length) {
      const h = (bytes[i2 + 3] << 8) | bytes[i2 + 4];
      const w = (bytes[i2 + 5] << 8) | bytes[i2 + 6];
      const csByte = bytes[i2 + 7];
      const colorSpace =
        csByte === 1 ? "DeviceGray" : csByte === 4 ? "DeviceCMYK" : "DeviceRGB";
      return {
        width: w,
        height: h,
        colorSpace,
        invert: adobe && colorSpace === "DeviceCMYK",
        orientation,
      };
    }
    if (i2 + segLen > bytes.length) return null;
    i2 += segLen;
  }
  return null;
}
function paethPredictor(a, b, c) {
  const p = a + b - c;
  const pa = Math.abs(p - a),
    pb = Math.abs(p - b),
    pc = Math.abs(p - c);
  if (pa <= pb && pa <= pc) return a;
  if (pb <= pc) return b;
  return c;
}
function readPlteChunk(b) {
  let out = null;
  forEachChunk(b, (type, data) => {
    if (type === "PLTE") {
      if (data.length % 3 !== 0) {
        out = null;
        return true;
      }
      const entries = [];
      for (let o = 0; o < data.length; o += 3)
        entries.push(data.subarray(o, o + 3));
      out = entries;
      return true;
    }
    return type === "IDAT" || type === "IEND";
  });
  return out;
}
function readTrnsIndexed(b) {
  let out = null;
  forEachChunk(b, (type, data) => {
    if (type === "tRNS") {
      out = data;
      return true;
    }
    return type === "IDAT" || type === "IEND";
  });
  return out;
}
function collectIdat(b) {
  const parts = [];
  forEachChunk(b, (type, data) => {
    if (type === "IDAT") parts.push(data);
    return type === "IEND";
  });
  if (!parts.length) return null;
  let total = 0;
  for (const p of parts) total += p.length;
  const out = new Uint8Array(total);
  let off = 0;
  for (const p of parts) {
    out.set(p, off);
    off += p.length;
  }
  return out;
}
function parsePng(bytes) {
  const SIG = [137, 80, 78, 71, 13, 10, 26, 10];
  if (bytes.length < 33) return null;
  for (let k = 0; k < 8; k++) if (bytes[k] !== SIG[k]) return null;
  if (!(
    bytes[12] === 73 &&
    bytes[13] === 72 &&
    bytes[14] === 68 &&
    bytes[15] === 82
  ))
    return null;
  const u32 = (o) =>
    ((bytes[o] << 24) |
      (bytes[o + 1] << 16) |
      (bytes[o + 2] << 8) |
      bytes[o + 3]) >>>
    0;
  const w = u32(16);
  const h = u32(20);
  if (w === 0 || h === 0) return null;
  const bpc = bytes[24];
  const ct = bytes[25];
  if (bytes[28] !== 0) return null;
  if (bpc !== 8) return null;
  let chIn, chOut, colorSpace, hasAlpha;
  if (ct === 0) {
    chIn = 1;
    chOut = 1;
    colorSpace = "DeviceGray";
    hasAlpha = false;
  } else if (ct === 2) {
    chIn = 3;
    chOut = 3;
    colorSpace = "DeviceRGB";
    hasAlpha = false;
  } else if (ct === 3) {
    chIn = 1;
    chOut = 3;
    colorSpace = "DeviceRGB";
    hasAlpha = false;
  } else if (ct === 4) {
    chIn = 2;
    chOut = 1;
    colorSpace = "DeviceGray";
    hasAlpha = true;
  } else if (ct === 6) {
    chIn = 4;
    chOut = 3;
    colorSpace = "DeviceRGB";
    hasAlpha = true;
  } else return null;
  if (ct !== 3 && hasTrnsChunk(bytes)) return null;
  let paletteRgb = null;
  let paletteAlpha = null;
  if (ct === 3) {
    paletteRgb = readPlteChunk(bytes);
    if (!paletteRgb || !paletteRgb.length) return null;
    paletteAlpha = new Uint8Array(paletteRgb.length).fill(255);
    const trns = readTrnsIndexed(bytes);
    if (trns) {
      hasAlpha = false;
      for (let idx = 0; idx < trns.length; idx++) {
        if (trns[idx] !== 255) hasAlpha = true;
        if (idx < paletteAlpha.length) paletteAlpha[idx] = trns[idx];
      }
    }
  }
  const idat = collectIdat(bytes);
  if (!idat || !idat.length) return null;
  const stride = w * chIn;
  const rowLen = stride + 1;
  const needed = h * rowLen;
  const MAX_DECODED_BYTES = 512 * 1024 * 1024;
  if (needed > MAX_DECODED_BYTES || w * h * chOut > MAX_DECODED_BYTES)
    return null;
  let raw;
  try {
    raw = unzlibSync(idat, { out: new Uint8Array(needed) });
  } catch {
    return null;
  }
  if (raw.length < needed) return null;
  const pixels = new Uint8Array(w * h * chOut);
  let pixelsOff = 0;
  const smask = hasAlpha ? new Uint8Array(w * h) : null;
  let smaskOff = 0;
  let prev = new Uint8Array(stride);
  let row = new Uint8Array(stride);
  for (let r = 0; r < h; r++) {
    const base = r * rowLen;
    const ft = raw[base];
    const src = raw.subarray(base + 1, base + 1 + stride);
    if (ft === 0) {
      row.set(src);
    } else if (ft === 1) {
      for (let j = 0; j < stride; j++) {
        const a = j >= chIn ? row[j - chIn] : 0;
        row[j] = (src[j] + a) & 255;
      }
    } else if (ft === 2) {
      for (let j = 0; j < stride; j++) row[j] = (src[j] + prev[j]) & 255;
    } else if (ft === 3) {
      for (let j = 0; j < stride; j++) {
        const a = j >= chIn ? row[j - chIn] : 0;
        row[j] = (src[j] + ((a + prev[j]) >> 1)) & 255;
      }
    } else if (ft === 4) {
      for (let j = 0; j < stride; j++) {
        const a = j >= chIn ? row[j - chIn] : 0;
        const c = j >= chIn ? prev[j - chIn] : 0;
        row[j] = (src[j] + paethPredictor(a, prev[j], c)) & 255;
      }
    } else {
      row.set(src);
    }
    if (paletteRgb) {
      for (let j = 0; j < stride; j++) {
        const idx = row[j];
        if (idx >= paletteRgb.length) return null;
        const rgb = paletteRgb[idx];
        pixels[pixelsOff++] = rgb[0];
        pixels[pixelsOff++] = rgb[1];
        pixels[pixelsOff++] = rgb[2];
        if (smask) smask[smaskOff++] = paletteAlpha[idx];
      }
    } else if (chIn !== chOut) {
      for (let j = 0; j < stride; j += chIn) {
        for (let k = 0; k < chOut; k++) pixels[pixelsOff++] = row[j + k];
        if (smask) smask[smaskOff++] = row[j + chIn - 1];
      }
    } else {
      pixels.set(row, pixelsOff);
      pixelsOff += stride;
    }
    const tmp = row;
    row = prev;
    prev = tmp;
  }
  return {
    width: w,
    height: h,
    colorSpace,
    data: pixels,
    smask,
    isJpeg: false,
    decodeInvert: false,
    orientation: 1,
  };
}
export { parseImage };
