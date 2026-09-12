/* @ts-self-types="./taetype.d.ts" */

/**
 * @param {Uint8Array} compressed
 * @returns {Uint8Array}
 */
export function decompress_brotli(compressed) {
  try {
    const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
    const ptr0 = passArray8ToWasm0(compressed, wasm.__wbindgen_export);
    const len0 = WASM_VECTOR_LEN;
    wasm.decompress_brotli(retptr, ptr0, len0);
    var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
    var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
    var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
    var r3 = getDataViewMemory0().getInt32(retptr + 4 * 3, true);
    if (r3) {
      throw takeObject(r2);
    }
    var v2 = getArrayU8FromWasm0(r0, r1).slice();
    wasm.__wbindgen_export4(r0, r1 * 1, 1);
    return v2;
  } finally {
    wasm.__wbindgen_add_to_stack_pointer(16);
  }
}

/**
 * @param {string} font_name
 * @param {string} style
 * @param {number} codepoint
 * @returns {boolean}
 */
export function font_has_glyph(font_name, style, codepoint) {
  const ptr0 = passStringToWasm0(
    font_name,
    wasm.__wbindgen_export,
    wasm.__wbindgen_export2,
  );
  const len0 = WASM_VECTOR_LEN;
  const ptr1 = passStringToWasm0(
    style,
    wasm.__wbindgen_export,
    wasm.__wbindgen_export2,
  );
  const len1 = WASM_VECTOR_LEN;
  const ret = wasm.font_has_glyph(ptr0, len0, ptr1, len1, codepoint);
  return ret !== 0;
}

/**
 * @param {string} font_name
 * @param {string} style
 * @param {number} weight
 * @param {number} opsz
 * @param {Uint16Array} glyph_ids
 * @returns {Float64Array}
 */
export function get_advance_widths(font_name, style, weight, opsz, glyph_ids) {
  const ptr0 = passStringToWasm0(
    font_name,
    wasm.__wbindgen_export,
    wasm.__wbindgen_export2,
  );
  const len0 = WASM_VECTOR_LEN;
  const ptr1 = passStringToWasm0(
    style,
    wasm.__wbindgen_export,
    wasm.__wbindgen_export2,
  );
  const len1 = WASM_VECTOR_LEN;
  const ptr2 = passArray16ToWasm0(glyph_ids, wasm.__wbindgen_export);
  const len2 = WASM_VECTOR_LEN;
  const ret = wasm.get_advance_widths(
    ptr0,
    len0,
    ptr1,
    len1,
    weight,
    opsz,
    ptr2,
    len2,
  );
  return takeObject(ret);
}

/**
 * @param {string} font_name
 * @param {string} style
 * @param {number} gid
 * @returns {Uint32Array}
 */
export function get_colr_layers(font_name, style, gid) {
  const ptr0 = passStringToWasm0(
    font_name,
    wasm.__wbindgen_export,
    wasm.__wbindgen_export2,
  );
  const len0 = WASM_VECTOR_LEN;
  const ptr1 = passStringToWasm0(
    style,
    wasm.__wbindgen_export,
    wasm.__wbindgen_export2,
  );
  const len1 = WASM_VECTOR_LEN;
  const ret = wasm.get_colr_layers(ptr0, len0, ptr1, len1, gid);
  return takeObject(ret);
}

/**
 * @param {Uint8Array} woff2_bytes
 * @returns {any}
 */
export function get_compressed_range(woff2_bytes) {
  try {
    const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
    const ptr0 = passArray8ToWasm0(woff2_bytes, wasm.__wbindgen_export);
    const len0 = WASM_VECTOR_LEN;
    wasm.get_compressed_range(retptr, ptr0, len0);
    var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
    var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
    var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
    if (r2) {
      throw takeObject(r1);
    }
    return takeObject(r0);
  } finally {
    wasm.__wbindgen_add_to_stack_pointer(16);
  }
}

/**
 * @param {string} font_name
 * @param {string} style
 * @param {number} gid
 * @param {number} target_ppem
 * @returns {any}
 */
export function get_glyph_bitmap(font_name, style, gid, target_ppem) {
  const ptr0 = passStringToWasm0(
    font_name,
    wasm.__wbindgen_export,
    wasm.__wbindgen_export2,
  );
  const len0 = WASM_VECTOR_LEN;
  const ptr1 = passStringToWasm0(
    style,
    wasm.__wbindgen_export,
    wasm.__wbindgen_export2,
  );
  const len1 = WASM_VECTOR_LEN;
  const ret = wasm.get_glyph_bitmap(ptr0, len0, ptr1, len1, gid, target_ppem);
  return takeObject(ret);
}

/**
 * @param {string} text
 * @param {string} font_name
 * @param {string} style
 * @param {number} weight
 * @returns {Uint16Array}
 */
export function get_glyph_ids(text, font_name, style, weight) {
  const ptr0 = passStringToWasm0(
    text,
    wasm.__wbindgen_export,
    wasm.__wbindgen_export2,
  );
  const len0 = WASM_VECTOR_LEN;
  const ptr1 = passStringToWasm0(
    font_name,
    wasm.__wbindgen_export,
    wasm.__wbindgen_export2,
  );
  const len1 = WASM_VECTOR_LEN;
  const ptr2 = passStringToWasm0(
    style,
    wasm.__wbindgen_export,
    wasm.__wbindgen_export2,
  );
  const len2 = WASM_VECTOR_LEN;
  const ret = wasm.get_glyph_ids(ptr0, len0, ptr1, len1, ptr2, len2, weight);
  return takeObject(ret);
}

/**
 * @param {string} font_name
 * @param {string} style
 * @param {number} weight
 * @param {number} opsz
 * @param {number} gid
 * @returns {number}
 */
export function get_vertical_advance(font_name, style, weight, opsz, gid) {
  const ptr0 = passStringToWasm0(
    font_name,
    wasm.__wbindgen_export,
    wasm.__wbindgen_export2,
  );
  const len0 = WASM_VECTOR_LEN;
  const ptr1 = passStringToWasm0(
    style,
    wasm.__wbindgen_export,
    wasm.__wbindgen_export2,
  );
  const len1 = WASM_VECTOR_LEN;
  const ret = wasm.get_vertical_advance(
    ptr0,
    len0,
    ptr1,
    len1,
    weight,
    opsz,
    gid,
  );
  return ret >>> 0;
}

/**
 * @returns {Array<any>}
 */
export function list_registered_fonts() {
  const ret = wasm.list_registered_fonts();
  return takeObject(ret);
}

/**
 * @param {string} text
 * @param {string} font_name
 * @param {string} style
 * @param {number} weight
 * @param {number} opsz
 * @param {number} font_size
 * @returns {number}
 */
export function measure_string_width(
  text,
  font_name,
  style,
  weight,
  opsz,
  font_size,
) {
  const ptr0 = passStringToWasm0(
    text,
    wasm.__wbindgen_export,
    wasm.__wbindgen_export2,
  );
  const len0 = WASM_VECTOR_LEN;
  const ptr1 = passStringToWasm0(
    font_name,
    wasm.__wbindgen_export,
    wasm.__wbindgen_export2,
  );
  const len1 = WASM_VECTOR_LEN;
  const ptr2 = passStringToWasm0(
    style,
    wasm.__wbindgen_export,
    wasm.__wbindgen_export2,
  );
  const len2 = WASM_VECTOR_LEN;
  const ret = wasm.measure_string_width(
    ptr0,
    len0,
    ptr1,
    len1,
    ptr2,
    len2,
    weight,
    opsz,
    font_size,
  );
  return ret;
}

/**
 * @param {Uint8Array} woff2_bytes
 * @param {Uint8Array} decompressed
 * @param {number} index
 * @returns {any}
 */
export function read_font_meta(woff2_bytes, decompressed, index) {
  try {
    const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
    const ptr0 = passArray8ToWasm0(woff2_bytes, wasm.__wbindgen_export);
    const len0 = WASM_VECTOR_LEN;
    const ptr1 = passArray8ToWasm0(decompressed, wasm.__wbindgen_export);
    const len1 = WASM_VECTOR_LEN;
    wasm.read_font_meta(retptr, ptr0, len0, ptr1, len1, index);
    var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
    var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
    var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
    if (r2) {
      throw takeObject(r1);
    }
    return takeObject(r0);
  } finally {
    wasm.__wbindgen_add_to_stack_pointer(16);
  }
}

/**
 * @param {string} name
 * @param {string} style
 * @param {number} weight
 * @param {number} opsz
 * @param {Uint8Array} woff2_bytes
 * @param {Uint8Array} decompressed
 * @param {number} index
 */
export function register_font(
  name,
  style,
  weight,
  opsz,
  woff2_bytes,
  decompressed,
  index,
) {
  try {
    const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
    const ptr0 = passStringToWasm0(
      name,
      wasm.__wbindgen_export,
      wasm.__wbindgen_export2,
    );
    const len0 = WASM_VECTOR_LEN;
    const ptr1 = passStringToWasm0(
      style,
      wasm.__wbindgen_export,
      wasm.__wbindgen_export2,
    );
    const len1 = WASM_VECTOR_LEN;
    const ptr2 = passArray8ToWasm0(woff2_bytes, wasm.__wbindgen_export);
    const len2 = WASM_VECTOR_LEN;
    const ptr3 = passArray8ToWasm0(decompressed, wasm.__wbindgen_export);
    const len3 = WASM_VECTOR_LEN;
    wasm.register_font(
      retptr,
      ptr0,
      len0,
      ptr1,
      len1,
      weight,
      opsz,
      ptr2,
      len2,
      ptr3,
      len3,
      index,
    );
    var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
    var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
    if (r1) {
      throw takeObject(r0);
    }
  } finally {
    wasm.__wbindgen_add_to_stack_pointer(16);
  }
}

/**
 * @param {string} name
 * @param {Uint8Array} raw_bytes
 */
export function register_font_raw(name, raw_bytes) {
  try {
    const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
    const ptr0 = passStringToWasm0(
      name,
      wasm.__wbindgen_export,
      wasm.__wbindgen_export2,
    );
    const len0 = WASM_VECTOR_LEN;
    const ptr1 = passArray8ToWasm0(raw_bytes, wasm.__wbindgen_export);
    const len1 = WASM_VECTOR_LEN;
    wasm.register_font_raw(retptr, ptr0, len0, ptr1, len1);
    var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
    var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
    if (r1) {
      throw takeObject(r0);
    }
  } finally {
    wasm.__wbindgen_add_to_stack_pointer(16);
  }
}

/**
 * @param {string} name
 * @param {Uint8Array} ttc_bytes
 * @param {number} index
 */
export function register_font_ttc(name, ttc_bytes, index) {
  try {
    const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
    const ptr0 = passStringToWasm0(
      name,
      wasm.__wbindgen_export,
      wasm.__wbindgen_export2,
    );
    const len0 = WASM_VECTOR_LEN;
    const ptr1 = passArray8ToWasm0(ttc_bytes, wasm.__wbindgen_export);
    const len1 = WASM_VECTOR_LEN;
    wasm.register_font_ttc(retptr, ptr0, len0, ptr1, len1, index);
    var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
    var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
    if (r1) {
      throw takeObject(r0);
    }
  } finally {
    wasm.__wbindgen_add_to_stack_pointer(16);
  }
}

/**
 * @param {string} text
 * @param {string} font_name
 * @param {string} style
 * @param {number} weight
 * @param {number} opsz
 * @param {boolean} vertical
 * @returns {any}
 */
export function shape_text(text, font_name, style, weight, opsz, vertical) {
  const ptr0 = passStringToWasm0(
    text,
    wasm.__wbindgen_export,
    wasm.__wbindgen_export2,
  );
  const len0 = WASM_VECTOR_LEN;
  const ptr1 = passStringToWasm0(
    font_name,
    wasm.__wbindgen_export,
    wasm.__wbindgen_export2,
  );
  const len1 = WASM_VECTOR_LEN;
  const ptr2 = passStringToWasm0(
    style,
    wasm.__wbindgen_export,
    wasm.__wbindgen_export2,
  );
  const len2 = WASM_VECTOR_LEN;
  const ret = wasm.shape_text(
    ptr0,
    len0,
    ptr1,
    len1,
    ptr2,
    len2,
    weight,
    opsz,
    vertical,
  );
  return takeObject(ret);
}

/**
 * @param {string} font_name
 * @param {string} style
 * @param {number} weight
 * @param {number} opsz
 * @param {Uint16Array} glyph_ids
 * @returns {any}
 */
export function subset_font_full(font_name, style, weight, opsz, glyph_ids) {
  const ptr0 = passStringToWasm0(
    font_name,
    wasm.__wbindgen_export,
    wasm.__wbindgen_export2,
  );
  const len0 = WASM_VECTOR_LEN;
  const ptr1 = passStringToWasm0(
    style,
    wasm.__wbindgen_export,
    wasm.__wbindgen_export2,
  );
  const len1 = WASM_VECTOR_LEN;
  const ptr2 = passArray16ToWasm0(glyph_ids, wasm.__wbindgen_export);
  const len2 = WASM_VECTOR_LEN;
  const ret = wasm.subset_font_full(
    ptr0,
    len0,
    ptr1,
    len1,
    weight,
    opsz,
    ptr2,
    len2,
  );
  return takeObject(ret);
}

/**
 * @param {Uint8Array} bytes
 * @returns {number}
 */
export function ttc_font_count(bytes) {
  const ptr0 = passArray8ToWasm0(bytes, wasm.__wbindgen_export);
  const len0 = WASM_VECTOR_LEN;
  const ret = wasm.ttc_font_count(ptr0, len0);
  return ret >>> 0;
}
function __wbg_get_imports() {
  const import0 = {
    __proto__: null,
    __wbg___wbindgen_debug_string_07cb72cfcc952e2b: function (arg0, arg1) {
      const ret = debugString(getObject(arg1));
      const ptr1 = passStringToWasm0(
        ret,
        wasm.__wbindgen_export,
        wasm.__wbindgen_export2,
      );
      const len1 = WASM_VECTOR_LEN;
      getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
      getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
    },
    __wbg___wbindgen_string_get_965592073e5d848c: function (arg0, arg1) {
      const obj = getObject(arg1);
      const ret = typeof obj === "string" ? obj : undefined;
      var ptr1 = isLikeNone(ret)
        ? 0
        : passStringToWasm0(
            ret,
            wasm.__wbindgen_export,
            wasm.__wbindgen_export2,
          );
      var len1 = WASM_VECTOR_LEN;
      getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
      getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
    },
    __wbg___wbindgen_throw_9c75d47bf9e7731e: function (arg0, arg1) {
      throw new Error(getStringFromWasm0(arg0, arg1));
    },
    __wbg_new_2fad8ca02fd00684: function () {
      const ret = new Object();
      return addHeapObject(ret);
    },
    __wbg_new_3baa8d9866155c79: function () {
      const ret = new Array();
      return addHeapObject(ret);
    },
    __wbg_new_from_slice_2279da1957569dd1: function (arg0, arg1) {
      const ret = new Uint16Array(getArrayU16FromWasm0(arg0, arg1));
      return addHeapObject(ret);
    },
    __wbg_new_from_slice_3ca7c4e9a43341b6: function (arg0, arg1) {
      const ret = new Float64Array(getArrayF64FromWasm0(arg0, arg1));
      return addHeapObject(ret);
    },
    __wbg_new_from_slice_5a173c243af2e823: function (arg0, arg1) {
      const ret = new Uint8Array(getArrayU8FromWasm0(arg0, arg1));
      return addHeapObject(ret);
    },
    __wbg_new_from_slice_823acd363b3844cf: function (arg0, arg1) {
      const ret = new Uint32Array(getArrayU32FromWasm0(arg0, arg1));
      return addHeapObject(ret);
    },
    __wbg_new_with_length_081a36b9d84bbaef: function (arg0) {
      const ret = new Uint16Array(arg0 >>> 0);
      return addHeapObject(ret);
    },
    __wbg_new_with_length_2a29aa33411ddc89: function (arg0) {
      const ret = new Float64Array(arg0 >>> 0);
      return addHeapObject(ret);
    },
    __wbg_new_with_length_b91f070a091394cc: function (arg0) {
      const ret = new Uint32Array(arg0 >>> 0);
      return addHeapObject(ret);
    },
    __wbg_push_60a5366c0bb22a7d: function (arg0, arg1) {
      const ret = getObject(arg0).push(getObject(arg1));
      return ret;
    },
    __wbg_set_5337f8ac82364a3f: function () {
      return handleError(function (arg0, arg1, arg2) {
        const ret = Reflect.set(
          getObject(arg0),
          getObject(arg1),
          getObject(arg2),
        );
        return ret;
      }, arguments);
    },
    __wbindgen_cast_0000000000000001: function (arg0) {
      // Cast intrinsic for `F64 -> Externref`.
      const ret = arg0;
      return addHeapObject(ret);
    },
    __wbindgen_cast_0000000000000002: function (arg0, arg1) {
      // Cast intrinsic for `Ref(String) -> Externref`.
      const ret = getStringFromWasm0(arg0, arg1);
      return addHeapObject(ret);
    },
    __wbindgen_object_drop_ref: function (arg0) {
      takeObject(arg0);
    },
  };
  return {
    __proto__: null,
    "./taetype_bg.js": import0,
  };
}

function addHeapObject(obj) {
  if (heap_next === heap.length) heap.push(heap.length + 1);
  const idx = heap_next;
  heap_next = heap[idx];

  heap[idx] = obj;
  return idx;
}

function debugString(val) {
  // primitive types
  const type = typeof val;
  if (type == "number" || type == "boolean" || val == null) {
    return `${val}`;
  }
  if (type == "string") {
    return `"${val}"`;
  }
  if (type == "symbol") {
    const description = val.description;
    if (description == null) {
      return "Symbol";
    } else {
      return `Symbol(${description})`;
    }
  }
  if (type == "function") {
    const name = val.name;
    if (typeof name == "string" && name.length > 0) {
      return `Function(${name})`;
    } else {
      return "Function";
    }
  }
  // objects
  if (Array.isArray(val)) {
    const length = val.length;
    let debug = "[";
    if (length > 0) {
      debug += debugString(val[0]);
    }
    for (let i = 1; i < length; i++) {
      debug += ", " + debugString(val[i]);
    }
    debug += "]";
    return debug;
  }
  // Test for built-in
  const builtInMatches = /\[object ([^\]]+)\]/.exec(toString.call(val));
  let className;
  if (builtInMatches && builtInMatches.length > 1) {
    className = builtInMatches[1];
  } else {
    // Failed to match the standard '[object ClassName]'
    return toString.call(val);
  }
  if (className == "Object") {
    // we're a user defined class or Object
    // JSON.stringify avoids problems with cycles, and is generally much
    // easier than looping through ownProperties of `val`.
    try {
      return "Object(" + JSON.stringify(val) + ")";
    } catch (_) {
      return "Object";
    }
  }
  // errors
  if (val instanceof Error) {
    return `${val.name}: ${val.message}\n${val.stack}`;
  }
  // TODO we could test for more things here, like `Set`s and `Map`s.
  return className;
}

function dropObject(idx) {
  if (idx < 1028) return;
  heap[idx] = heap_next;
  heap_next = idx;
}

function getArrayF64FromWasm0(ptr, len) {
  ptr = ptr >>> 0;
  return getFloat64ArrayMemory0().subarray(ptr / 8, ptr / 8 + len);
}

function getArrayU16FromWasm0(ptr, len) {
  ptr = ptr >>> 0;
  return getUint16ArrayMemory0().subarray(ptr / 2, ptr / 2 + len);
}

function getArrayU32FromWasm0(ptr, len) {
  ptr = ptr >>> 0;
  return getUint32ArrayMemory0().subarray(ptr / 4, ptr / 4 + len);
}

function getArrayU8FromWasm0(ptr, len) {
  ptr = ptr >>> 0;
  return getUint8ArrayMemory0().subarray(ptr / 1, ptr / 1 + len);
}

let cachedDataViewMemory0 = null;
function getDataViewMemory0() {
  if (
    cachedDataViewMemory0 === null ||
    cachedDataViewMemory0.buffer.detached === true ||
    (cachedDataViewMemory0.buffer.detached === undefined &&
      cachedDataViewMemory0.buffer !== wasm.memory.buffer)
  ) {
    cachedDataViewMemory0 = new DataView(wasm.memory.buffer);
  }
  return cachedDataViewMemory0;
}

let cachedFloat64ArrayMemory0 = null;
function getFloat64ArrayMemory0() {
  if (
    cachedFloat64ArrayMemory0 === null ||
    cachedFloat64ArrayMemory0.byteLength === 0
  ) {
    cachedFloat64ArrayMemory0 = new Float64Array(wasm.memory.buffer);
  }
  return cachedFloat64ArrayMemory0;
}

function getStringFromWasm0(ptr, len) {
  return decodeText(ptr >>> 0, len);
}

let cachedUint16ArrayMemory0 = null;
function getUint16ArrayMemory0() {
  if (
    cachedUint16ArrayMemory0 === null ||
    cachedUint16ArrayMemory0.byteLength === 0
  ) {
    cachedUint16ArrayMemory0 = new Uint16Array(wasm.memory.buffer);
  }
  return cachedUint16ArrayMemory0;
}

let cachedUint32ArrayMemory0 = null;
function getUint32ArrayMemory0() {
  if (
    cachedUint32ArrayMemory0 === null ||
    cachedUint32ArrayMemory0.byteLength === 0
  ) {
    cachedUint32ArrayMemory0 = new Uint32Array(wasm.memory.buffer);
  }
  return cachedUint32ArrayMemory0;
}

let cachedUint8ArrayMemory0 = null;
function getUint8ArrayMemory0() {
  if (
    cachedUint8ArrayMemory0 === null ||
    cachedUint8ArrayMemory0.byteLength === 0
  ) {
    cachedUint8ArrayMemory0 = new Uint8Array(wasm.memory.buffer);
  }
  return cachedUint8ArrayMemory0;
}

function getObject(idx) {
  return heap[idx];
}

function handleError(f, args) {
  try {
    return f.apply(this, args);
  } catch (e) {
    wasm.__wbindgen_export3(addHeapObject(e));
  }
}

let heap = new Array(1024).fill(undefined);
heap.push(undefined, null, true, false);

let heap_next = heap.length;

function isLikeNone(x) {
  return x === undefined || x === null;
}

function passArray16ToWasm0(arg, malloc) {
  const ptr = malloc(arg.length * 2, 2) >>> 0;
  getUint16ArrayMemory0().set(arg, ptr / 2);
  WASM_VECTOR_LEN = arg.length;
  return ptr;
}

function passArray8ToWasm0(arg, malloc) {
  const ptr = malloc(arg.length * 1, 1) >>> 0;
  getUint8ArrayMemory0().set(arg, ptr / 1);
  WASM_VECTOR_LEN = arg.length;
  return ptr;
}

function passStringToWasm0(arg, malloc, realloc) {
  if (realloc === undefined) {
    const buf = cachedTextEncoder.encode(arg);
    const ptr = malloc(buf.length, 1) >>> 0;
    getUint8ArrayMemory0()
      .subarray(ptr, ptr + buf.length)
      .set(buf);
    WASM_VECTOR_LEN = buf.length;
    return ptr;
  }

  let len = arg.length;
  let ptr = malloc(len, 1) >>> 0;

  const mem = getUint8ArrayMemory0();

  let offset = 0;

  for (; offset < len; offset++) {
    const code = arg.charCodeAt(offset);
    if (code > 0x7f) break;
    mem[ptr + offset] = code;
  }
  if (offset !== len) {
    if (offset !== 0) {
      arg = arg.slice(offset);
    }
    ptr = realloc(ptr, len, (len = offset + arg.length * 3), 1) >>> 0;
    const view = getUint8ArrayMemory0().subarray(ptr + offset, ptr + len);
    const ret = cachedTextEncoder.encodeInto(arg, view);

    offset += ret.written;
    ptr = realloc(ptr, len, offset, 1) >>> 0;
  }

  WASM_VECTOR_LEN = offset;
  return ptr;
}

function takeObject(idx) {
  const ret = getObject(idx);
  dropObject(idx);
  return ret;
}

let cachedTextDecoder = new TextDecoder("utf-8", {
  ignoreBOM: true,
  fatal: true,
});
cachedTextDecoder.decode();
const MAX_SAFARI_DECODE_BYTES = 2146435072;
let numBytesDecoded = 0;
function decodeText(ptr, len) {
  numBytesDecoded += len;
  if (numBytesDecoded >= MAX_SAFARI_DECODE_BYTES) {
    cachedTextDecoder = new TextDecoder("utf-8", {
      ignoreBOM: true,
      fatal: true,
    });
    cachedTextDecoder.decode();
    numBytesDecoded = len;
  }
  return cachedTextDecoder.decode(
    getUint8ArrayMemory0().subarray(ptr, ptr + len),
  );
}

const cachedTextEncoder = new TextEncoder();

if (!("encodeInto" in cachedTextEncoder)) {
  cachedTextEncoder.encodeInto = function (arg, view) {
    const buf = cachedTextEncoder.encode(arg);
    view.set(buf);
    return {
      read: arg.length,
      written: buf.length,
    };
  };
}

let WASM_VECTOR_LEN = 0;

let wasmModule, wasmInstance, wasm;
function __wbg_finalize_init(instance, module) {
  wasmInstance = instance;
  wasm = instance.exports;
  wasmModule = module;
  cachedDataViewMemory0 = null;
  cachedFloat64ArrayMemory0 = null;
  cachedUint16ArrayMemory0 = null;
  cachedUint32ArrayMemory0 = null;
  cachedUint8ArrayMemory0 = null;
  return wasm;
}

async function __wbg_load(module, imports) {
  if (typeof Response === "function" && module instanceof Response) {
    if (typeof WebAssembly.instantiateStreaming === "function") {
      try {
        return await WebAssembly.instantiateStreaming(module, imports);
      } catch (e) {
        const validResponse = module.ok && expectedResponseType(module.type);

        if (
          validResponse &&
          module.headers.get("Content-Type") !== "application/wasm"
        ) {
          console.warn(
            "`WebAssembly.instantiateStreaming` failed because your server does not serve Wasm with `application/wasm` MIME type. Falling back to `WebAssembly.instantiate` which is slower. Original error:\n",
            e,
          );
        } else {
          throw e;
        }
      }
    }

    const bytes = await module.arrayBuffer();
    return await WebAssembly.instantiate(bytes, imports);
  } else {
    const instance = await WebAssembly.instantiate(module, imports);

    if (instance instanceof WebAssembly.Instance) {
      return { instance, module };
    } else {
      return instance;
    }
  }

  function expectedResponseType(type) {
    switch (type) {
      case "basic":
      case "cors":
      case "default":
        return true;
    }
    return false;
  }
}

function initSync(module) {
  if (wasm !== undefined) return wasm;

  if (module !== undefined) {
    if (Object.getPrototypeOf(module) === Object.prototype) {
      ({ module } = module);
    } else {
      console.warn(
        "using deprecated parameters for `initSync()`; pass a single object instead",
      );
    }
  }

  const imports = __wbg_get_imports();
  if (!(module instanceof WebAssembly.Module)) {
    module = new WebAssembly.Module(module);
  }
  const instance = new WebAssembly.Instance(module, imports);
  return __wbg_finalize_init(instance, module);
}

async function __wbg_init(module_or_path) {
  if (wasm !== undefined) return wasm;

  if (module_or_path !== undefined) {
    if (Object.getPrototypeOf(module_or_path) === Object.prototype) {
      ({ module_or_path } = module_or_path);
    } else {
      console.warn(
        "using deprecated parameters for the initialization function; pass a single object instead",
      );
    }
  }

  if (module_or_path === undefined) {
    module_or_path = new URL("taetype_bg.wasm", import.meta.url);
  }
  const imports = __wbg_get_imports();

  if (
    typeof module_or_path === "string" ||
    (typeof Request === "function" && module_or_path instanceof Request) ||
    (typeof URL === "function" && module_or_path instanceof URL)
  ) {
    module_or_path = fetch(module_or_path);
  }

  const { instance, module } = await __wbg_load(await module_or_path, imports);

  return __wbg_finalize_init(instance, module);
}

export { initSync, __wbg_init as default };
