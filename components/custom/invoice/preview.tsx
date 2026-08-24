"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { getTemplate } from "@/lib/invoice-templates";
import { usePrintSettings } from "@/hooks/use-print-settings";
import { useServerNow } from "@/hooks/use-server-now";
import { getUserTimeZone } from "@/lib/print-pdf";
import type { PrintSettings } from "@/lib/print-settings";
import type { CompanyInfo, InvoiceData } from "@/lib/types";

const A4_WIDTH = 794;
const A4_HEIGHT = 1123;
const ATOMIC_SELECTOR = '[data-pgbreak="avoid"]';

interface PaginatedMarkup {
  html: string;
  pageOffsets: number[];
}

function makeSpacer(height: number): HTMLDivElement {
  const el = document.createElement("div");
  el.style.height = `${height}px`;
  return el;
}

function makeFragment(html: string): HTMLDivElement {
  const el = document.createElement("div");
  el.innerHTML = html;
  return el;
}

function paginate(
  bodyMarkup: string,
  headerHtml: string,
  footerHtml: string,
  settings: PrintSettings,
  pageMargin: { side: number; bottom: number; top: number },
  topBarHeight: number,
  topBarFn: () => string,
): PaginatedMarkup {
  const hidden = document.createElement("div");
  hidden.style.cssText = `position:fixed;top:-99999px;left:-99999px;width:${A4_WIDTH}px;height:auto;visibility:hidden;`;
  document.body.appendChild(hidden);

  try {
    const headerProbe = makeFragment(headerHtml);
    headerProbe.style.overflow = "hidden";
    hidden.appendChild(headerProbe);
    const headerH = headerProbe.getBoundingClientRect().height;
    hidden.removeChild(headerProbe);

    const footerProbe = makeFragment(footerHtml);
    hidden.appendChild(footerProbe);
    const footerH = footerProbe.getBoundingClientRect().height;
    hidden.removeChild(footerProbe);

    const topReserve = (pageIndex: number) =>
      pageIndex === 0
        ? 0
        : settings.headerMode === "every"
          ? headerH
          : pageMargin.top + topBarHeight;
    const hasFooter = (pageIndex: number, isLast: boolean) =>
      settings.footerMode === "every" || isLast;
    const bottomReserve = (pageIndex: number, isLast: boolean) =>
      hasFooter(pageIndex, isLast) ? footerH : pageMargin.bottom;

    hidden.innerHTML = bodyMarkup;
    // Page 0 always gets a real header. Prepending it before any measuring
    // keeps it inside the coordinate frame the seams are computed in, so page
    // 0's footer and the later page offsets land on the true A4 boundaries
    // instead of being pushed down by the header's height. Overflow hidden
    // keeps it the same height as the mid-page headers (see below).
    const page0Header = makeFragment(headerHtml);
    page0Header.style.overflow = "hidden";
    hidden.insertBefore(page0Header, hidden.firstChild);
    const units = Array.from(
      hidden.querySelectorAll<HTMLElement>(ATOMIC_SELECTOR),
    );

    const hiddenTop = hidden.getBoundingClientRect().top;
    const rects = units.map((el) => {
      const rect = el.getBoundingClientRect();
      return { el, top: rect.top - hiddenTop, bottom: rect.bottom - hiddenTop };
    });

    // The item table's header row repeats at the top of every page that starts
    // with item rows. It is measured once from the live flow, then re-inserted
    // as a copy at each qualifying seam.
    const tableHeaderEl = hidden.querySelector<HTMLElement>(
      '[data-pgtype="table-header"]',
    );
    const tableHeaderMarkup = tableHeaderEl?.outerHTML ?? "";
    const tableHeaderH = tableHeaderEl?.getBoundingClientRect().height ?? 0;
    const isItemRow = (el: HTMLElement | null | undefined) =>
      el?.getAttribute("data-pgtype") === "item-row";
    // Height the table header occupies at the top of a page (0 on page 0,
    // where the header is already part of the normal flow).
    const tableTopAt = (pageIndex: number) =>
      pageIndex > 0 && isItemRow(breaks[pageIndex - 1]?.unit)
        ? tableHeaderH
        : 0;

    // Each page's content budget is A4 - header (if any) - bottom margin -
    // footer (if any). The last page always carries a footer, but it is only
    // known after the breaks are found, so iterate to a fixed point — adding
    // the footer's reserve to the last page can only push content onto a new
    // page, so this converges after a pass or two.
    const computeBreaks = (isLastFor: (pageIndex: number) => boolean) => {
      const pageStarts = [0];
      const breaks: { unit: HTMLElement; usedBeforeBreak: number }[] = [];
      let pageIndex = 0;
      let pageStart = 0;
      let lastBottom = 0;

      for (const rect of rects) {
        // A page that starts with item rows gets the table header repeated at
        // its top, so reserve that height in addition to the page's own header
        // reservation — otherwise the repeated row would overflow the budget.
        const extraTop =
          pageIndex > 0 && isItemRow(breaks[pageIndex - 1]?.unit)
            ? tableHeaderH
            : 0;
        const budget =
          A4_HEIGHT -
          topReserve(pageIndex) -
          extraTop -
          bottomReserve(pageIndex, isLastFor(pageIndex));
        if (rect.bottom - pageStart > budget && rect.top > pageStart) {
          breaks.push({
            unit: rect.el,
            usedBeforeBreak: lastBottom - pageStart,
          });
          pageIndex += 1;
          pageStart = rect.top;
          pageStarts.push(pageStart);
        }
        lastBottom = rect.bottom;
      }
      return { pageStarts, breaks };
    };

    let pageStarts = [0];
    let breaks: { unit: HTMLElement; usedBeforeBreak: number }[] = [];
    let prevLast = -1;
    for (let pass = 0; pass < 10; pass += 1) {
      const lastGuess = prevLast === -1 ? Infinity : prevLast + 1;
      const result = computeBreaks((i) => i === lastGuess - 1);
      pageStarts = result.pageStarts;
      breaks = result.breaks;
      const last = pageStarts.length - 1;
      if (last === prevLast) break;
      prevLast = last;
    }
    const lastPageIndex = pageStarts.length - 1;

    // The body's bottom padding extends below its last unit; the last page's
    // footer is appended outside the body, so the pinning math must measure
    // the body's full bottom (padding included), not just the last unit's.
    const lastRect = rects[rects.length - 1];
    const bodyEl = lastRect?.el.parentElement ?? null;

    // At each seam: finish page i (footer copy, if any, pinned to that page's
    // bottom — otherwise fill the blank margin to the page edge), then start
    // page i+1 (header copy, if "every" — otherwise just a blank margin).
    // Consecutive page starts are spaced exactly one A4_HEIGHT apart, so the
    // preview's page window tiles perfectly.
    const pageStartMarkers: HTMLElement[] = [];

    breaks.forEach(({ unit, usedBeforeBreak }, i) => {
      const parent = unit.parentElement;
      if (!parent) return;

      const contentBottom = topReserve(i) + tableTopAt(i) + usedBeforeBreak;

      if (hasFooter(i, i === lastPageIndex)) {
        const padToFooter = A4_HEIGHT - footerH - contentBottom;
        if (padToFooter > 0) parent.insertBefore(makeSpacer(padToFooter), unit);
        const footer = makeFragment(footerHtml);
        footer.style.margin = `0 -${pageMargin.side}px`;
        footer.style.overflow = "hidden";
        parent.insertBefore(footer, unit);
      } else {
        const padToBoundary = A4_HEIGHT - contentBottom;
        if (padToBoundary > 0)
          parent.insertBefore(makeSpacer(padToBoundary), unit);
      }

      const marker =
        settings.headerMode === "every"
          ? makeFragment(headerHtml)
          : // Header only on page 0, but the top bar still repeats: a full-width
            // band plus the blank top margin the chrome would otherwise
            // leave above its content.
            makeFragment(
              `${topBarFn()}<div style="height:${pageMargin.top}px"></div>`,
            );
      {
        marker.style.margin = `0 -${pageMargin.side}px`;
        marker.style.overflow = "hidden";
      }
      parent.insertBefore(marker, unit);
      // A page that starts with item rows gets a fresh copy of the table
      // header at its top, so the columns stay labeled on every page.
      if (isItemRow(unit)) {
        parent.insertBefore(makeFragment(tableHeaderMarkup), unit);
      }
      pageStartMarkers.push(marker);
    });

    // The true last page always gets a real footer, pinned to its bottom —
    // regardless of mode, since "last" means exactly this page. The seam math
    // above runs against coordinates measured before any marker was inserted,
    // so pin here from the final layout: the footer's top lands at the true
    // last page start plus one page height, minus the footer's own height.
    const finalHiddenTop = hidden.getBoundingClientRect().top;
    const lastPageStart =
      pageStartMarkers.length > 0
        ? pageStartMarkers[pageStartMarkers.length - 1].getBoundingClientRect()
            .top - finalHiddenTop
        : 0;
    const bodyBottom = bodyEl
      ? bodyEl.getBoundingClientRect().bottom - finalHiddenTop
      : 0;
    const finalPushDown = lastPageStart + A4_HEIGHT - footerH - bodyBottom;
    if (finalPushDown > 0) hidden.appendChild(makeSpacer(finalPushDown));
    hidden.appendChild(makeFragment(footerHtml));

    const pageOffsets = [
      0,
      ...pageStartMarkers.map(
        (marker) => marker.getBoundingClientRect().top - finalHiddenTop,
      ),
    ];

    return { html: hidden.innerHTML, pageOffsets };
  } finally {
    document.body.removeChild(hidden);
  }
}

export function InvoicePreview({
  data,
  company,
  templateId,
}: {
  data: InvoiceData;
  company: CompanyInfo;
  templateId?: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { settings } = usePrintSettings();
  const printDate = useServerNow();
  const timeZone = getUserTimeZone();
  const [scale, setScale] = useState(1);
  const [renderedHtml, setRenderedHtml] = useState("");
  const [pageOffsets, setPageOffsets] = useState<number[]>([0]);
  const [page, setPage] = useState(0);

  const template = getTemplate(templateId ?? "standard");
  const PAGE_MARGIN = template.pageMargin;
  const TOP_BAR_HEIGHT = template.topBarHeight;

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const update = () => {
      const cw = container.clientWidth;
      const ch = container.clientHeight;
      setScale(Math.min(cw / A4_WIDTH, ch / A4_HEIGHT));
    };
    update();
    const observer = new ResizeObserver(update);
    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  // React attaches its synthetic onWheel listener as passive, so
  // preventDefault() inside it is silently ignored — a native listener is
  // required to actually stop the page from scrolling while paging.
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const onWheel = (e: WheelEvent) => {
      if (pageOffsets.length <= 1) return;
      e.preventDefault();
      if (e.deltaY > 0) setPage((p) => Math.min(p + 1, pageOffsets.length - 1));
      else if (e.deltaY < 0) setPage((p) => Math.max(p - 1, 0));
    };
    container.addEventListener("wheel", onWheel, { passive: false });
    return () => container.removeEventListener("wheel", onWheel);
  }, [pageOffsets]);

  const bodyMarkup = useMemo(
    () =>
      template.markup(data, {
        printDate,
        timeZone,
      }),
    [data, printDate, timeZone, template],
  );
  const headerHtml = useMemo(
    () => template.headerChrome(data, company, printDate, timeZone),
    [data, company, printDate, timeZone, template],
  );
  const footerHtml = useMemo(
    () => template.footerChrome(company, data.id),
    [template, company, data.id],
  );

  useEffect(() => {
    const timer = setTimeout(() => {
      const result = paginate(
        bodyMarkup,
        headerHtml,
        footerHtml,
        settings,
        PAGE_MARGIN,
        TOP_BAR_HEIGHT,
        template.topBar,
      );
      setRenderedHtml(result.html);
      setPageOffsets(result.pageOffsets);
      setPage((p) => Math.min(p, result.pageOffsets.length - 1));
    }, 0);
    return () => clearTimeout(timer);
  }, [
    bodyMarkup,
    headerHtml,
    footerHtml,
    settings,
    PAGE_MARGIN,
    TOP_BAR_HEIGHT,
    template,
  ]);

  return (
    <div
      ref={containerRef}
      className="flex h-full w-full items-center justify-center overflow-hidden"
    >
      <div style={{ width: A4_WIDTH * scale, height: A4_HEIGHT * scale }}>
        <div
          style={{
            width: A4_WIDTH,
            height: A4_HEIGHT,
            overflow: "hidden",
            position: "relative",
            background: "#FFFFFF",
            transform: `scale(${scale})`,
            transformOrigin: "top left",
          }}
        >
          <div
            style={{
              position: "absolute",
              top: -(pageOffsets[page] ?? 0),
              left: 0,
              width: A4_WIDTH,
            }}
            dangerouslySetInnerHTML={{ __html: renderedHtml }}
          />
        </div>
      </div>
    </div>
  );
}
