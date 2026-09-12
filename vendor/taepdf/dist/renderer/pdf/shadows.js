// renderer/pdf/shadows.ts
import { anyRadius } from "../types/index.js";
function grownCorner(c, by) {
  if (c.h <= 0 || c.v <= 0) return { h: 0, v: 0 };
  return { h: Math.max(0, c.h + by), v: Math.max(0, c.v + by) };
}
function emitShadows(doc, shadows, x, y, w, h, rr) {
  const rounded = anyRadius(rr);
  for (const sh of shadows) {
    const sx = x + sh.x,
      sy = y + sh.y;
    const ext = sh.spread ?? 0;
    const steps = Math.min(60, Math.max(1, Math.ceil(sh.blur / 2)));
    if (sh.inset) {
      doc.save_graphics_state();
      if (rounded) {
        doc.set_clip_rounded_rect(x, y, w, h, rr.tl, rr.tr, rr.br, rr.bl);
      } else {
        doc.set_clip_rect(x, y, w, h);
      }
    } else {
      doc.save_graphics_state();
      doc.set_clip_outside_rounded_rect(x, y, w, h, rr.tl, rr.tr, rr.br, rr.bl);
    }
    doc.set_fill_color(sh.color[0], sh.color[1], sh.color[2]);
    if (sh.inset) {
      for (let i = steps; i >= 1; i--) {
        const alpha = ((sh.color[3] ?? 255) / 255) * (i / steps) * 0.4;
        const band = Math.max(
          0,
          (sh.blur / steps) * (steps - i + 1) * 0.5 + ext,
        );
        if (!band) continue;
        doc.set_alpha(alpha);
        doc.border_ring(sx, sy, w, h, rr.tl, rr.tr, rr.br, rr.bl, band);
      }
    } else {
      for (let i = steps; i >= 1; i--) {
        const alpha = ((sh.color[3] ?? 255) / 255) * (i / steps) * 0.4;
        const expand = (sh.blur / steps) * (steps - i + 1) * 0.5;
        const grow = expand + ext;
        const gw = w + grow * 2,
          gh = h + grow * 2;
        if (gw <= 0 || gh <= 0) continue;
        doc.set_alpha(alpha);
        if (rounded) {
          doc.rounded_rect(
            sx - grow,
            sy - grow,
            gw,
            gh,
            grownCorner(rr.tl, grow),
            grownCorner(rr.tr, grow),
            grownCorner(rr.br, grow),
            grownCorner(rr.bl, grow),
            "F",
          );
        } else {
          doc.rect(sx - grow, sy - grow, gw, gh, "F");
        }
      }
    }
    doc.set_alpha(1);
    doc.restore_graphics_state();
  }
}
export { emitShadows };
