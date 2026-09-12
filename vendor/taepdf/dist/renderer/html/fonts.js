// renderer/html/fonts.ts
import { list_registered_fonts } from "../../engine.js";
import { font_has_glyph } from "../../taetype/taetype.js";
var _fontMapCache = null;
var _glyphCache = /* @__PURE__ */ new Map();
function invalidateFontMapCache() {
  _fontMapCache = null;
  _glyphCache = /* @__PURE__ */ new Map();
}
function hasGlyphCached(name, style, codepoint) {
  const key = `${name}|${style}|${codepoint}`;
  let hit = _glyphCache.get(key);
  if (hit === void 0) {
    hit = font_has_glyph(name, style, codepoint);
    _glyphCache.set(key, hit);
  }
  return hit;
}
function buildRegisteredFontMap() {
  if (_fontMapCache) return _fontMapCache;
  const map = /* @__PURE__ */ new Map();
  const list = list_registered_fonts();
  for (const entry of list) {
    const colon = entry.indexOf(":");
    if (colon < 0) continue;
    const name = entry.slice(0, colon);
    const style = entry.slice(colon + 1);
    const arr = map.get(name) ?? [];
    arr.push(style);
    map.set(name, arr);
  }
  _fontMapCache = map;
  return map;
}
function cssWeightNum(w) {
  if (w === "bold") return 700;
  if (w === "normal") return 400;
  const n = parseInt(w, 10);
  return isNaN(n) ? 400 : n;
}
function pickStyle(name, weight, italic, reg) {
  const styles = reg.get(name);
  if (!styles || !styles.length) return null;
  if (styles.length === 1) return styles[0];
  const isBold = (x) =>
    x.includes("bold") ||
    x.includes("semi") ||
    x.includes("medium") ||
    x.includes("heavy");
  const isItalic = (x) => x.includes("italic") || x.includes("oblique");
  if (italic && weight >= 500) {
    const s = styles.find((x) => isItalic(x) && isBold(x));
    if (s) return s;
  }
  if (italic) {
    const s = styles.find((x) => isItalic(x));
    if (s) return s;
  }
  if (weight >= 500) {
    const s = styles.find((x) => x === "bold" || isBold(x));
    if (s) return s;
  } else {
    const s = styles.find(
      (x) => x === "normal" || x === "regular" || x === "light" || x === "thin",
    );
    if (s) return s;
  }
  return styles[0];
}
function resolveOneFamily(fam, weight, italic, fontMap, reg) {
  const override = fontMap[fam] ?? fontMap[fam.toLowerCase()];
  if (override)
    return {
      name: override.name,
      style: override.style,
      weight: override.weight,
    };
  if (
    !fam ||
    [
      "sans-serif",
      "serif",
      "monospace",
      "system-ui",
      "cursive",
      "fantasy",
      "math",
    ].includes(fam.toLowerCase())
  )
    return null;
  const lname = fam.toLowerCase();
  const style = pickStyle(lname, weight, italic, reg);
  return style !== null ? { name: fam, style, weight } : null;
}
function resolveFontRef(family, weight, fStyle, fontMap, reg) {
  const cssWeight = cssWeightNum(weight);
  const italic = fStyle === "italic" || fStyle === "oblique";
  const families = family.split(",").map((f) =>
    f
      .trim()
      .replace(/^["']|["']$/g, "")
      .trim(),
  );
  for (const fam of families) {
    const ref = resolveOneFamily(fam, cssWeight, italic, fontMap, reg);
    if (ref) return ref;
  }
  return null;
}
function resolveGlyphFallback(
  codepoint,
  primary,
  family,
  weight,
  fStyle,
  fontMap,
  reg,
) {
  const cssWeight = cssWeightNum(weight);
  const italic = fStyle === "italic" || fStyle === "oblique";
  const families = family.split(",").map((f) =>
    f
      .trim()
      .replace(/^["']|["']$/g, "")
      .trim(),
  );
  const sameAsPrimary = (ref) =>
    ref.name.toLowerCase() === primary.name.toLowerCase() &&
    ref.style === primary.style;
  for (const fam of families) {
    const ref = resolveOneFamily(fam, cssWeight, italic, fontMap, reg);
    if (
      ref &&
      !sameAsPrimary(ref) &&
      hasGlyphCached(ref.name, ref.style, codepoint)
    )
      return ref;
  }
  for (const [name, styles] of reg) {
    for (const style of styles) {
      if (
        name.toLowerCase() === primary.name.toLowerCase() &&
        style === primary.style
      )
        continue;
      if (hasGlyphCached(name, style, codepoint))
        return { name, style, weight: cssWeight };
    }
  }
  return null;
}
function splitByFontCoverage(
  text,
  primary,
  family,
  weight,
  fStyle,
  fontMap,
  reg,
) {
  const chars = [...text];
  const fontFor = /* @__PURE__ */ new Map();
  let allPrimary = true;
  for (const ch of chars) {
    const cp = ch.codePointAt(0);
    if (fontFor.has(cp)) continue;
    if (hasGlyphCached(primary.name, primary.style, cp)) {
      fontFor.set(cp, primary);
      continue;
    }
    allPrimary = false;
    const fallback = resolveGlyphFallback(
      cp,
      primary,
      family,
      weight,
      fStyle,
      fontMap,
      reg,
    );
    fontFor.set(cp, fallback ?? primary);
  }
  if (allPrimary) return [{ text, font: primary }];
  const runs = [];
  let runStart = 0;
  let runFont = fontFor.get(chars[0].codePointAt(0));
  const sameRef = (a, b) =>
    a.name === b.name && a.style === b.style && a.weight === b.weight;
  for (let i = 1; i <= chars.length; i++) {
    const nextFont =
      i < chars.length ? fontFor.get(chars[i].codePointAt(0)) : null;
    if (nextFont && sameRef(nextFont, runFont)) continue;
    runs.push({ text: chars.slice(runStart, i).join(""), font: runFont });
    runStart = i;
    if (nextFont) runFont = nextFont;
  }
  return runs;
}
export {
  buildRegisteredFontMap,
  invalidateFontMapCache,
  resolveFontRef,
  resolveGlyphFallback,
  splitByFontCoverage,
};
