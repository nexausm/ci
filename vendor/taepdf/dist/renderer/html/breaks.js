// renderer/html/breaks.ts
var BREAK_ATTR = "data-tpdf-break";
var MAX_FIXES = 300;
function isOutOfFlow(cs) {
  return cs.position === "absolute" || cs.position === "fixed";
}
function wantsBreakBefore(cs) {
  const v = cs.breakBefore ?? "";
  return v === "page" || v === "left" || v === "right" || v === "always";
}
function wantsBreakAfter(cs) {
  const v = cs.breakAfter ?? "";
  return v === "page" || v === "left" || v === "right" || v === "always";
}
function avoidsBreakInside(cs) {
  const v = cs.breakInside ?? "";
  return v === "avoid" || v === "avoid-page";
}
var ATOMIC_TAGS = /* @__PURE__ */ new Set(["IMG", "CANVAS", "SVG", "TR"]);
function isAtomic(el, cs) {
  if (ATOMIC_TAGS.has(el.tagName.toUpperCase())) return true;
  if (avoidsBreakInside(cs)) return true;
  const d = cs.display;
  return (
    d === "flex" || d === "grid" || d === "inline-flex" || d === "inline-grid"
  );
}
function pushHeight(top, containerTop, pageHPx) {
  const rel = top - containerTop;
  const next = (Math.floor(rel / pageHPx) + 1) * pageHPx;
  return next - rel;
}
function makeSpacer(doc, forTag, heightPx) {
  if (forTag === "TR") {
    const tr = doc.createElement("tr");
    tr.setAttribute(BREAK_ATTR, "");
    const td = doc.createElement("td");
    td.colSpan = 100;
    td.style.cssText = `height:${heightPx}px;padding:0;border:0;background:transparent;`;
    tr.appendChild(td);
    return tr;
  }
  const div = doc.createElement("div");
  div.setAttribute(BREAK_ATTR, "");
  div.style.cssText = `display:block;height:${heightPx}px;margin:0;padding:0;border:0;`;
  return div;
}
function insertSpacer(node, targetRect, containerTop, pageHPx) {
  const parent = node.parentNode;
  if (!parent) return false;
  const doc = node.ownerDocument ?? document;
  const startTop = targetRect().top;
  const h = pushHeight(startTop, containerTop, pageHPx);
  if (h <= 0.5 || h >= pageHPx) return false;
  const forTag =
    node.nodeType === Node.ELEMENT_NODE ? node.tagName.toUpperCase() : "";
  const spacer = makeSpacer(doc, forTag, h);
  parent.insertBefore(spacer, node);
  const intendedRel =
    (Math.floor((startTop - containerTop) / pageHPx) + 1) * pageHPx;
  const actualRel = targetRect().top - containerTop;
  const residual = intendedRel - actualRel;
  if (Math.abs(residual) > 0.5) {
    const inner = forTag === "TR" ? spacer.firstElementChild : spacer;
    const newH = h + residual;
    if (newH <= 0.5 || newH >= pageHPx * 1.5) {
      parent.removeChild(spacer);
      return false;
    }
    inner.style.height = `${newH}px`;
  }
  return true;
}
function repeatThead(tr) {
  if (tr.closest("thead")) return;
  const table = tr.closest("table");
  if (!table) return;
  const thead = table.querySelector(":scope > thead");
  if (!thead || !thead.rows.length) return;
  const parent = tr.parentNode;
  if (!parent) return;
  const frag = (tr.ownerDocument ?? document).createDocumentFragment();
  for (const row of Array.from(thead.rows)) {
    const clone = row.cloneNode(true);
    clone.setAttribute(BREAK_ATTR, "");
    frag.appendChild(clone);
  }
  parent.insertBefore(frag, tr);
}
function crossesBoundary(rect, containerTop, pageHPx) {
  if (rect.height <= 0.5 || rect.height >= pageHPx) return false;
  const topRel = rect.top - containerTop;
  const botRel = rect.bottom - containerTop;
  return (
    Math.floor((topRel + 0.5) / pageHPx) !==
    Math.floor((botRel - 0.5) / pageHPx)
  );
}
function atPageTop(rect, containerTop, pageHPx) {
  const rel = (rect.top - containerTop) % pageHPx;
  return rel < 1;
}
function findViolation(root, containerTop, pageHPx, skip) {
  let best = null;
  const consider = (top, fix, node) => {
    if (skip.has(node)) return;
    if (best === null || top < best.top - 0.5) {
      best = {
        top,
        fix: () => {
          const ok = fix();
          if (!ok) skip.add(node);
          return ok;
        },
      };
    }
  };
  const walkEl = (el) => {
    const cs = getComputedStyle(el);
    if (el !== root) {
      if (cs.display === "none" || isOutOfFlow(cs)) return;
      if (el.hasAttribute(BREAK_ATTR)) return;
    }
    const rect = el.getBoundingClientRect();
    if (
      wantsBreakBefore(cs) &&
      rect.height > 0 &&
      !atPageTop(rect, containerTop, pageHPx)
    ) {
      consider(
        rect.top,
        () =>
          insertSpacer(
            el,
            () => el.getBoundingClientRect(),
            containerTop,
            pageHPx,
          ),
        el,
      );
    }
    if (wantsBreakAfter(cs)) {
      let sib = el.nextElementSibling;
      while (
        sib &&
        (sib.hasAttribute(BREAK_ATTR) ||
          getComputedStyle(sib).display === "none")
      )
        sib = sib.nextElementSibling;
      if (sib) {
        const sr = sib.getBoundingClientRect();
        const target = sib;
        if (sr.height > 0 && !atPageTop(sr, containerTop, pageHPx)) {
          consider(
            sr.top,
            () =>
              insertSpacer(
                target,
                () => target.getBoundingClientRect(),
                containerTop,
                pageHPx,
              ),
            target,
          );
        }
      }
    }
    if (isAtomic(el, cs)) {
      if (crossesBoundary(rect, containerTop, pageHPx)) {
        const isRow = el.tagName.toUpperCase() === "TR";
        const fix = () => {
          const ok = insertSpacer(
            el,
            () => el.getBoundingClientRect(),
            containerTop,
            pageHPx,
          );
          if (ok && isRow) repeatThead(el);
          return ok;
        };
        consider(rect.top, fix, el);
      }
      return;
    }
    for (const child of Array.from(el.childNodes)) {
      if (child.nodeType === Node.ELEMENT_NODE) {
        walkEl(child);
      } else if (
        child.nodeType === Node.TEXT_NODE &&
        (child.textContent ?? "").trim()
      ) {
        walkText(child);
      }
    }
  };
  const walkText = (textNode) => {
    const range = (textNode.ownerDocument ?? document).createRange();
    range.selectNodeContents(textNode);
    const rects = Array.from(range.getClientRects()).filter(
      (r) => r.height > 0.5 && r.width > 0.1,
    );
    for (const r of rects) {
      if (!crossesBoundary(r, containerTop, pageHPx)) continue;
      const lineTop = r.top;
      consider(
        lineTop,
        () =>
          fixTextLineWithOrphansWidows(
            textNode,
            lineTop,
            containerTop,
            pageHPx,
          ),
        textNode,
      );
      break;
    }
  };
  walkEl(root);
  return best;
}
function fixTextLine(textNode, lineTop, containerTop, pageHPx) {
  const doc = textNode.ownerDocument ?? document;
  const range = doc.createRange();
  const len = textNode.length;
  let splitAt = -1;
  for (let i = 0; i < len; i++) {
    range.setStart(textNode, i);
    range.setEnd(textNode, i + 1);
    const cr = range.getBoundingClientRect();
    if (cr.height <= 0.5 && cr.width <= 0.1) continue;
    if (cr.top >= lineTop - 1) {
      splitAt = i;
      break;
    }
  }
  if (splitAt < 0) return false;
  let target = textNode;
  if (splitAt > 0) target = textNode.splitText(splitAt);
  const parent = target.parentNode;
  if (!parent) return false;
  const block = doc.createElement("span");
  block.setAttribute(BREAK_ATTR, "");
  block.style.cssText = "display:block;height:1px;margin:0;padding:0;border:0;";
  parent.insertBefore(block, target);
  const rectOf = () => {
    const r2 = doc.createRange();
    r2.setStart(target, 0);
    r2.setEnd(target, Math.min(1, target.length));
    return r2.getBoundingClientRect();
  };
  const startTop = rectOf().top;
  const h = pushHeight(startTop, containerTop, pageHPx);
  if (h <= 0.5 || h >= pageHPx) {
    parent.removeChild(block);
    return false;
  }
  block.style.height = `${h}px`;
  const intendedRel =
    (Math.floor((startTop - containerTop) / pageHPx) + 1) * pageHPx;
  const residual = intendedRel - (rectOf().top - containerTop);
  if (Math.abs(residual) > 0.5) {
    const newH = h + residual;
    if (newH <= 0.5 || newH >= pageHPx * 1.5) {
      parent.removeChild(block);
      return false;
    }
    block.style.height = `${newH}px`;
  }
  return true;
}
function findLineBlock(node) {
  let el = node.parentElement;
  while (el) {
    const d = getComputedStyle(el).display;
    if (
      d === "block" ||
      d === "list-item" ||
      d === "table-cell" ||
      d === "flow-root"
    )
      return el;
    el = el.parentElement;
  }
  return null;
}
function fixLineAcrossBlock(block, targetTop, containerTop, pageHPx) {
  const doc = block.ownerDocument ?? document;
  const walker = doc.createTreeWalker(block, NodeFilter.SHOW_TEXT);
  const range = doc.createRange();
  let node;
  while ((node = walker.nextNode())) {
    const text = node;
    for (let i = 0; i < text.length; i++) {
      range.setStart(text, i);
      range.setEnd(text, i + 1);
      const cr = range.getBoundingClientRect();
      if (cr.height <= 0.5 && cr.width <= 0.1) continue;
      if (cr.top >= targetTop - 1)
        return fixTextLine(text, targetTop, containerTop, pageHPx);
    }
  }
  return false;
}
function fixTextLineWithOrphansWidows(
  textNode,
  lineTop,
  containerTop,
  pageHPx,
) {
  const block = findLineBlock(textNode);
  if (!block) return fixTextLine(textNode, lineTop, containerTop, pageHPx);
  const cs = getComputedStyle(block);
  const orphans = parseInt(cs.orphans, 10) || 2;
  const widows = parseInt(cs.widows, 10) || 2;
  if (orphans <= 1 && widows <= 1)
    return fixTextLine(textNode, lineTop, containerTop, pageHPx);
  const doc = textNode.ownerDocument ?? document;
  const blockRange = doc.createRange();
  blockRange.selectNodeContents(block);
  const lineRects = Array.from(blockRange.getClientRects()).filter(
    (r) => r.height > 0.5 && r.width > 0.1,
  );
  if (!lineRects.length)
    return fixTextLine(textNode, lineTop, containerTop, pageHPx);
  const N = lineRects.length;
  const K = lineRects.findIndex((r) => Math.abs(r.top - lineTop) < 1);
  if (K < 0) return fixTextLine(textNode, lineTop, containerTop, pageHPx);
  if (K < orphans) {
    return insertSpacer(
      block,
      () => block.getBoundingClientRect(),
      containerTop,
      pageHPx,
    );
  }
  const splitIdx = N - K < widows ? Math.max(orphans, N - widows) : K;
  if (splitIdx === K)
    return fixTextLine(textNode, lineTop, containerTop, pageHPx);
  return fixLineAcrossBlock(
    block,
    lineRects[splitIdx].top,
    containerTop,
    pageHPx,
  );
}
function applyPageBreaks(root, pageHPx) {
  if (pageHPx <= 0) return;
  const mightBreak = /break-(?:before|after|inside)/.test(root.innerHTML);
  if (!mightBreak && root.scrollHeight <= pageHPx + 0.5) return;
  const skip = /* @__PURE__ */ new Set();
  for (let i = 0; i < MAX_FIXES; i++) {
    const containerTop = root.getBoundingClientRect().top;
    const violation = findViolation(root, containerTop, pageHPx, skip);
    if (!violation) return;
    violation.fix();
  }
  console.warn(
    "[taepdf] Page-break pass hit the fix cap \u2014 layout may still contain cut content.",
  );
}
function undoPageBreaks(root) {
  const spacers = root.querySelectorAll(`[${BREAK_ATTR}]`);
  const parents = /* @__PURE__ */ new Set();
  for (const sp of Array.from(spacers)) {
    if (sp.parentNode) parents.add(sp.parentNode);
    sp.remove();
  }
  for (const p of parents) p.normalize();
}
export { applyPageBreaks, undoPageBreaks };
