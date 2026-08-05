"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { invoiceMarkup } from "@/lib/invoice-markup";
import type { CompanyInfo, InvoiceData } from "@/lib/types";

const A4_WIDTH = 794;
const A4_HEIGHT = 1123;

export function InvoicePreview({
  data,
  company,
}: {
  data: InvoiceData;
  company: CompanyInfo;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

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

  const markup = useMemo(() => invoiceMarkup(data, company), [data, company]);

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
            transform: `scale(${scale})`,
            transformOrigin: "top left",
          }}
          dangerouslySetInnerHTML={{ __html: markup }}
        />
      </div>
    </div>
  );
}
