// renderer/pdf/index.ts
import { measure_string_width } from "../../engine.js";
import { PdfDoc } from "../pdf_doc/index.js";
import { resolvePageSize, resolveRadius, anyRadius } from "../types/index.js";
import { emitShadows } from "./shadows.js";
import {
  applyMetadata,
  applyBookmarks,
  applySecurity,
  resolveSecurityConfig,
  applyStructTree,
  applyPdfA,
} from "./finalize.js";
import { rasterizeSVGs } from "./svg.js";
function applyToPDF(commands, def, anchors, structRoot) {
  const size = resolvePageSize(def.config.size, def.config.orientation);
  const doc = new PdfDoc(size.width, size.height);
  let currentPage = 1;
  const imageCache = /* @__PURE__ */ new Map();
  if (anchors) {
    for (const [id, entry] of anchors) {
      doc.add_named_dest(id, entry.page, entry.y);
    }
  }
  for (const cmd of commands) {
    if (cmd.page !== currentPage) {
      doc.set_page(cmd.page);
      currentPage = cmd.page;
    }
    if (cmd.type === "text") {
      const c = cmd;
      const tagged = c.mcid !== void 0 && c.structTag !== void 0;
      if (tagged) doc.begin_marked_content(c.structTag, c.mcid);
      doc.set_font(c.font, c.style, c.weight);
      doc.set_font_size(c.size);
      doc.set_text_color(c.color[0], c.color[1], c.color[2]);
      if (c.letterSpacing) doc.set_char_space(c.letterSpacing);
      if (c.wordSpacing) doc.set_word_spacing(c.wordSpacing);
      const hasTextGState =
        (c.opacity !== void 0 && c.opacity < 1) || !!c.blend;
      if (hasTextGState) doc.set_alpha(c.opacity ?? 1, c.blend);
      const stroke = c.stroke
        ? {
            color: c.stroke,
            width: c.strokeWidth ?? 0,
            strokeOnly: !!c.strokeOnly,
          }
        : void 0;
      if (c.vertical) {
        doc.text_vertical(c.text, c.x, c.y, stroke);
      } else {
        let px = c.x;
        if (c.align !== "left" || c.direction === "rtl") {
          const w = measure_string_width(
            c.text,
            c.font,
            c.style,
            c.weight,
            0,
            c.size,
          );
          if (c.align === "center") px = c.x + c.maxWidth / 2 - w / 2;
          else if (c.align === "right") px = c.x + c.maxWidth - w;
          else if (c.direction === "rtl") px = c.x + c.maxWidth - w;
        }
        doc.text(c.text, px, c.y, "alphabetic", stroke);
      }
      if (c.letterSpacing) doc.set_char_space(0);
      if (c.wordSpacing) doc.set_word_spacing(0);
      if (hasTextGState) doc.set_alpha(1);
      if (tagged) doc.end_marked_content();
    } else if (cmd.type === "link") {
      const c = cmd;
      if (c.href.startsWith("#")) {
        let frag = c.href.slice(1);
        try {
          frag = decodeURIComponent(frag);
        } catch {}
        const dest = anchors?.get(frag) ?? anchors?.get(c.href.slice(1));
        if (dest)
          doc.add_goto_annotation(c.x, c.y, c.w, c.h, dest.page, dest.y);
      } else {
        const lower = c.href.toLowerCase().trimStart();
        if (
          lower.startsWith("http://") ||
          lower.startsWith("https://") ||
          lower.startsWith("mailto:")
        ) {
          let uri = c.href;
          try {
            uri = encodeURI(c.href);
          } catch {}
          doc.add_link_annotation(c.x, c.y, c.w, c.h, uri);
        }
      }
    } else if (cmd.type === "rect") {
      const c = cmd;
      const rr = resolveRadius(c.radius);
      const hasRadius = anyRadius(rr);
      const outerShadows = c.shadow?.filter((s) => !s.inset) ?? [];
      const insetShadows = c.shadow?.filter((s) => s.inset) ?? [];
      if (outerShadows.length) {
        emitShadows(doc, outerShadows, c.x, c.y, c.w, c.h, rr);
      }
      const hasRectGState =
        (c.opacity !== void 0 && c.opacity < 1) || !!c.blend;
      if (hasRectGState) doc.set_alpha(c.opacity ?? 1, c.blend);
      if (c.gradient) {
        const g = c.gradient;
        const stopsFlat = new Float64Array(
          g.stops.flatMap((s) => [
            s.position,
            s.color[0],
            s.color[1],
            s.color[2],
            s.color[3],
          ]),
        );
        const isRadial = g.type === "radial";
        const gradId = doc.add_gradient(
          isRadial ? 1 : 0,
          g.type === "linear" ? (g.angle ?? 0) : 0,
          stopsFlat,
          isRadial ? (g.cx ?? 0.5) : 0.5,
          isRadial ? (g.cy ?? 0.5) : 0.5,
          isRadial ? (g.fx ?? g.cx ?? 0.5) : 0.5,
          isRadial ? (g.fy ?? g.cy ?? 0.5) : 0.5,
        );
        if (hasRadius) {
          doc.fill_with_gradient_rounded(
            gradId,
            c.x,
            c.y,
            c.w,
            c.h,
            rr.tl,
            rr.tr,
            rr.br,
            rr.bl,
          );
        } else {
          doc.fill_with_gradient(gradId, c.x, c.y, c.w, c.h);
        }
      } else if (c.fill) {
        doc.set_fill_color(c.fill[0], c.fill[1], c.fill[2]);
        if (hasRadius)
          doc.rounded_rect(c.x, c.y, c.w, c.h, rr.tl, rr.tr, rr.br, rr.bl, "F");
        else doc.rect(c.x, c.y, c.w, c.h, "F");
      }
      if (c.stroke) {
        if (c.strokeStyle === "dashed" || c.strokeStyle === "dotted") {
          const sw = c.strokeWidth ?? 0.5;
          const dash =
            c.strokeStyle === "dashed"
              ? [Math.max(2, sw * 3), Math.max(1.5, sw * 2)]
              : [Math.max(0.5, sw), Math.max(1, sw * 1.5)];
          doc.set_draw_color(c.stroke[0], c.stroke[1], c.stroke[2]);
          doc.stroke_rounded_rect_dashed(
            c.x,
            c.y,
            c.w,
            c.h,
            rr.tl,
            rr.tr,
            rr.br,
            rr.bl,
            sw,
            dash,
          );
        } else {
          doc.set_fill_color(c.stroke[0], c.stroke[1], c.stroke[2]);
          doc.border_ring(
            c.x,
            c.y,
            c.w,
            c.h,
            rr.tl,
            rr.tr,
            rr.br,
            rr.bl,
            c.strokeWidth ?? 0.5,
          );
        }
      }
      if (insetShadows.length) {
        emitShadows(doc, insetShadows, c.x, c.y, c.w, c.h, rr);
      }
      if (hasRectGState) doc.set_alpha(1);
    } else if (cmd.type === "line") {
      const c = cmd;
      const hasLineGState =
        (c.opacity !== void 0 && c.opacity < 1) || !!c.blend;
      if (hasLineGState) doc.set_alpha(c.opacity ?? 1, c.blend);
      doc.set_draw_color(c.color[0], c.color[1], c.color[2]);
      doc.set_line_width(c.width);
      if (c.lineStyle === "dashed") {
        doc.set_line_dash(
          [Math.max(2, c.width * 3), Math.max(1.5, c.width * 2)],
          0,
        );
        doc.line(c.x1, c.y1, c.x2, c.y2);
        doc.set_line_dash([], 0);
      } else if (c.lineStyle === "dotted") {
        doc.set_line_dash(
          [Math.max(0.5, c.width), Math.max(1, c.width * 1.5)],
          0,
        );
        doc.line(c.x1, c.y1, c.x2, c.y2);
        doc.set_line_dash([], 0);
      } else if (c.lineStyle === "wavy") {
        doc.wavy_line(
          c.x1,
          c.y1,
          c.x2,
          c.y2,
          Math.max(0.6, c.width * 1.2),
          Math.max(3, c.width * 4),
        );
      } else {
        doc.line(c.x1, c.y1, c.x2, c.y2);
      }
      if (hasLineGState) doc.set_alpha(1);
    } else if (cmd.type === "clip-push") {
      const c = cmd;
      doc.save_graphics_state();
      if (c.path) {
        doc.set_clip_path(c.path, !!c.evenOdd);
      } else if (
        c.x !== void 0 &&
        c.y !== void 0 &&
        c.w !== void 0 &&
        c.h !== void 0
      ) {
        const cr = resolveRadius(c.radius);
        if (anyRadius(cr)) {
          doc.set_clip_rounded_rect(
            c.x,
            c.y,
            c.w,
            c.h,
            cr.tl,
            cr.tr,
            cr.br,
            cr.bl,
          );
        } else {
          doc.set_clip_rect(c.x, c.y, c.w, c.h);
        }
      }
    } else if (cmd.type === "clip-pop") {
      doc.restore_graphics_state();
    } else if (cmd.type === "transform-push") {
      const c = cmd;
      doc.save_graphics_state();
      if (c.matrix) doc.set_transform(c.matrix);
    } else if (cmd.type === "transform-pop") {
      doc.restore_graphics_state();
    } else if (cmd.type === "image") {
      const c = cmd;
      if (c.format === "svg") continue;
      if (c.w < 0.01 || c.h < 0.01) continue;
      let imageId = imageCache.get(c.src);
      if (imageId === void 0) {
        imageId = doc.embed_image(c.src);
        if (imageId !== 4294967295) imageCache.set(c.src, imageId);
      }
      if (imageId !== void 0 && imageId !== 4294967295) {
        const tagged = c.mcid !== void 0 && c.structTag !== void 0;
        if (tagged) doc.begin_marked_content(c.structTag, c.mcid);
        const hasGState = (c.opacity !== void 0 && c.opacity < 1) || !!c.blend;
        if (hasGState) doc.set_alpha(c.opacity ?? 1, c.blend);
        doc.draw_image(imageId, c.x, c.y, c.w, c.h);
        if (hasGState) doc.set_alpha(1);
        if (tagged) doc.end_marked_content();
      }
    } else if (cmd.type === "raw-image") {
      const c = cmd;
      if (c.w < 0.01 || c.h < 0.01) continue;
      let imageId = imageCache.get(c.raw);
      if (imageId === void 0) {
        imageId = doc.embed_raw_image(c.raw);
        if (imageId !== 4294967295) imageCache.set(c.raw, imageId);
      }
      if (imageId !== void 0 && imageId !== 4294967295) {
        const tagged = c.mcid !== void 0 && c.structTag !== void 0;
        if (tagged) doc.begin_marked_content(c.structTag, c.mcid);
        const hasGState = (c.opacity !== void 0 && c.opacity < 1) || !!c.blend;
        if (hasGState) doc.set_alpha(c.opacity ?? 1, c.blend);
        doc.draw_image(imageId, c.x, c.y, c.w, c.h);
        if (hasGState) doc.set_alpha(1);
        if (tagged) doc.end_marked_content();
      }
    } else if (cmd.type === "field") {
      const c = cmd;
      doc.add_form_field(
        c.x,
        c.y,
        c.w,
        c.h,
        c.fieldType,
        c.name,
        c.font,
        c.style,
        c.weight,
        c.size,
        c.color,
        c.value,
        c.checked,
        c.options,
      );
    } else if (cmd.type === "path") {
      const c = cmd;
      const hasPathGState =
        (c.opacity !== void 0 && c.opacity < 1) || !!c.blend;
      if (hasPathGState) doc.set_alpha(c.opacity ?? 1, c.blend);
      let gradientFill;
      if (c.gradient && c.gradientBox) {
        const g = c.gradient;
        const stopsFlat = new Float64Array(
          g.stops.flatMap((s) => [
            s.position,
            s.color[0],
            s.color[1],
            s.color[2],
            s.color[3],
          ]),
        );
        const isRadial = g.type === "radial";
        const gradId = doc.add_gradient(
          isRadial ? 1 : 0,
          g.type === "linear" ? (g.angle ?? 0) : 0,
          stopsFlat,
          isRadial ? (g.cx ?? 0.5) : 0.5,
          isRadial ? (g.cy ?? 0.5) : 0.5,
          isRadial ? (g.fx ?? g.cx ?? 0.5) : 0.5,
          isRadial ? (g.fy ?? g.cy ?? 0.5) : 0.5,
        );
        gradientFill = {
          gradientId: gradId,
          x: c.gradientBox.x,
          y: c.gradientBox.y,
          w: c.gradientBox.w,
          h: c.gradientBox.h,
        };
      }
      const stroke = c.stroke
        ? {
            color: c.stroke,
            width: c.strokeWidth ?? 1,
            dash: c.dashArray,
            lineCap: c.lineCap,
            lineJoin: c.lineJoin,
          }
        : void 0;
      doc.draw_path(c.ops, !!c.evenOdd, c.fill, gradientFill, stroke);
      if (hasPathGState) doc.set_alpha(1);
    }
  }
  if (def.metadata) applyMetadata(doc, def.metadata);
  if (def.bookmarks) applyBookmarks(doc, def.bookmarks);
  if (structRoot) applyStructTree(doc, structRoot);
  if (def.pdfA) applyPdfA(doc, def.metadata);
  const sec = resolveSecurityConfig(def.security);
  if (sec) applySecurity(doc, sec);
  return doc.output();
}
export { applyToPDF, rasterizeSVGs };
