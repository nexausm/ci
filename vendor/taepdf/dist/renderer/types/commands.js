// renderer/types/commands.ts
function resolveRadius(r) {
  const a = r?.all ?? 0;
  const c = (x) => (x ? { h: x.h, v: x.v } : { h: a, v: a });
  return {
    tl: c(r?.topLeft),
    tr: c(r?.topRight),
    br: c(r?.bottomRight),
    bl: c(r?.bottomLeft),
  };
}
function anyRadius(rr) {
  const rounded = (c) => c.h > 0 && c.v > 0;
  return rounded(rr.tl) || rounded(rr.tr) || rounded(rr.br) || rounded(rr.bl);
}
export { anyRadius, resolveRadius };
