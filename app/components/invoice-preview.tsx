"use client";

import { useEffect, useRef, useState } from "react";
import { pdf, type DocumentProps } from "@react-pdf/renderer";
import {
  getDocument,
  GlobalWorkerOptions,
  type PDFDocumentLoadingTask,
  type PDFDocumentProxy,
  type RenderTask,
} from "pdfjs-dist";

GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url,
).toString();

const RENDER_DEBOUNCE_MS = 250;

export function InvoicePreview({
  children,
}: {
  children: React.ReactElement<DocumentProps>;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const loadingTaskRef = useRef<PDFDocumentLoadingTask | null>(null);
  const [proxy, setProxy] = useState<PDFDocumentProxy | null>(null);

  useEffect(() => {
    let cancelled = false;
    const regenerate = async () => {
      try {
        const pdfInstance = pdf(children);
        const blob = await pdfInstance.toBlob();
        if (cancelled) return;
        loadingTaskRef.current?.destroy();
        loadingTaskRef.current = null;
        const task = getDocument({ data: await blob.arrayBuffer() });
        loadingTaskRef.current = task;
        const loaded = await task.promise;
        if (cancelled) return;
        setProxy(loaded);
      } catch {
        /* keep last rendered frame */
      }
    };

    const timer = setTimeout(regenerate, RENDER_DEBOUNCE_MS);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [children]);

  useEffect(() => {
    const container = containerRef.current;
    const visible = canvasRef.current;
    const pdfProxy = proxy;
    if (!pdfProxy || !container || !visible) return;

    let renderSeq = 0;
    let renderTask: RenderTask | null = null;

    async function render() {
      const seq = ++renderSeq;
      try {
        const page = await pdfProxy!.getPage(1);
        if (seq !== renderSeq) return;
        const cssHeight = container!.clientHeight;
        const cssWidth = container!.clientWidth;
        const dpr = window.devicePixelRatio || 1;
        const base = page.getViewport({ scale: 1 });
        const scale =
          Math.min(cssWidth / base.width, cssHeight / base.height) * dpr;
        const viewport = page.getViewport({ scale });

        const offscreen = document.createElement("canvas");
        offscreen.width = Math.max(1, Math.floor(viewport.width));
        offscreen.height = Math.max(1, Math.floor(viewport.height));
        const ctx = offscreen.getContext("2d");
        if (!ctx) return;

        if (renderTask) {
          renderTask.cancel();
          renderTask = null;
        }

        const task = page.render({
          canvas: offscreen,
          canvasContext: ctx,
          viewport,
        });
        renderTask = task;
        await task.promise;

        if (seq !== renderSeq) return;

        visible!.width = offscreen.width;
        visible!.height = offscreen.height;
        visible!.style.width = `${viewport.width / dpr}px`;
        visible!.style.height = `${viewport.height / dpr}px`;
        const visibleCtx = visible!.getContext("2d");
        if (!visibleCtx) return;
        visibleCtx.clearRect(0, 0, visible!.width, visible!.height);
        visibleCtx.drawImage(offscreen, 0, 0);
      } catch {
        /* cancelled or failed; a newer render supersedes this one */
      }
    }

    render();

    const observer = new ResizeObserver(() => render());
    observer.observe(container);
    return () => {
      observer.disconnect();
      renderSeq++;
      renderTask?.cancel();
    };
  }, [proxy]);

  return (
    <div
      ref={containerRef}
      className="flex h-full w-full items-center justify-center"
    >
      <canvas ref={canvasRef} />
    </div>
  );
}
