'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { getDocument, GlobalWorkerOptions } from 'pdfjs-dist';
import type { PDFDocumentProxy, PDFPageProxy } from 'pdfjs-dist';
import { Minus, Plus, Maximize2, ChevronsUpDown } from 'lucide-react';

GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.mjs',
  import.meta.url
).toString();

interface PdfViewerProps {
  data: Uint8Array;
}

type ZoomMode = 'width' | 'page' | 'custom';

export function PdfViewer({ data }: PdfViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [pdf, setPdf] = useState<PDFDocumentProxy | null>(null);
  const [pageCount, setPageCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [zoom, setZoom] = useState(100);
  const [zoomMode, setZoomMode] = useState<ZoomMode>('width');
  const [renderedPages, setRenderedPages] = useState<Set<number>>(new Set());
  const pageRefs = useRef<Map<number, HTMLDivElement>>(new Map());
  const renderingRef = useRef<Set<number>>(new Set());

  useEffect(() => {
    let cancelled = false;
    getDocument({ data: new Uint8Array(data) }).promise.then((doc) => {
      if (!cancelled) {
        setPdf(doc);
        setPageCount(doc.numPages);
      }
    });
    return () => { cancelled = true; };
  }, [data]);

  const getPageViewport = useCallback(async (pageNum: number, scale: number) => {
    if (!pdf) return null;
    const page = await pdf.getPage(pageNum);
    return page.getViewport({ scale });
  }, [pdf]);

  const renderPage = useCallback(async (pageNum: number, scale: number) => {
    if (!pdf || renderedPages.has(pageNum) || renderingRef.current.has(pageNum)) return;
    renderingRef.current.add(pageNum);

    try {
      const page = await pdf.getPage(pageNum);
      const viewport = page.getViewport({ scale: scale * (window.devicePixelRatio || 1) });
      const canvas = document.getElementById(`pdf-page-${pageNum}`) as HTMLCanvasElement | null;
      if (!canvas) return;

      canvas.width = viewport.width;
      canvas.height = viewport.height;
      canvas.style.width = `${viewport.width / (window.devicePixelRatio || 1)}px`;
      canvas.style.height = `${viewport.height / (window.devicePixelRatio || 1)}px`;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      await page.render({ canvasContext: ctx, viewport, canvas } as any).promise;
      setRenderedPages((prev) => new Set(prev).add(pageNum));
    } finally {
      renderingRef.current.delete(pageNum);
    }
  }, [pdf, renderedPages]);

  const getBaseScale = useCallback(() => {
    if (!pdf || !containerRef.current) return 1;
    const containerWidth = containerRef.current.clientWidth - 32;
    return containerWidth / 612;
  }, [pdf]);

  const renderAllPages = useCallback(async () => {
    if (!pdf) return;
    const baseScale = getBaseScale();
    const scale = zoomMode === 'width'
      ? baseScale
      : zoomMode === 'page'
        ? Math.min(baseScale, (containerRef.current?.clientHeight || 800) / 792)
        : baseScale * (zoom / 100);

    for (let i = 1; i <= pageCount; i++) {
      await renderPage(i, scale);
    }
  }, [pdf, pageCount, zoom, zoomMode, getBaseScale, renderPage]);

  useEffect(() => {
    renderAllPages();
  }, [renderAllPages]);

  useEffect(() => {
    if (zoomMode !== 'custom') {
      setRenderedPages(new Set());
    }
  }, [zoomMode]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const { scrollTop } = container;
      let page = 1;
      for (let i = 1; i <= pageCount; i++) {
        const el = pageRefs.current.get(i);
        if (el && el.offsetTop <= scrollTop + 100) {
          page = i;
        }
      }
      setCurrentPage(page);
    };

    container.addEventListener('scroll', handleScroll, { passive: true });
    return () => container.removeEventListener('scroll', handleScroll);
  }, [pageCount]);

  const handleZoomIn = () => {
    setZoomMode('custom');
    setZoom((z) => Math.min(z + 25, 300));
    setRenderedPages(new Set());
  };

  const handleZoomOut = () => {
    setZoomMode('custom');
    setZoom((z) => Math.max(z - 25, 50));
    setRenderedPages(new Set());
  };

  const handleFitWidth = () => {
    setZoomMode('width');
    setRenderedPages(new Set());
  };

  const handleFitPage = () => {
    setZoomMode('page');
    setRenderedPages(new Set());
  };

  return (
    <div className="flex flex-1 flex-col bg-muted/30">
      <div className="flex items-center justify-center gap-1 border-b border-border bg-white px-2 py-1.5 sm:gap-2">
        <button
          onClick={handleZoomOut}
          className="flex size-8 items-center justify-center rounded-lg text-muted transition-colors hover:bg-surface-muted hover:text-foreground active:scale-95"
          aria-label="Zoom out"
        >
          <Minus className="size-4" strokeWidth={1.5} />
        </button>
        <span className="min-w-[3rem] text-center text-xs font-medium tabular-nums text-muted-medium">
          {zoomMode === 'custom' ? `${zoom}%` : 'Fit'}
        </span>
        <button
          onClick={handleZoomIn}
          className="flex size-8 items-center justify-center rounded-lg text-muted transition-colors hover:bg-surface-muted hover:text-foreground active:scale-95"
          aria-label="Zoom in"
        >
          <Plus className="size-4" strokeWidth={1.5} />
        </button>
        <div className="mx-1 h-4 w-px bg-border" />
        <button
          onClick={handleFitWidth}
          className={`flex size-8 items-center justify-center rounded-lg transition-colors active:scale-95 ${
            zoomMode === 'width' ? 'bg-accent-light text-accent' : 'text-muted hover:bg-surface-muted hover:text-foreground'
          }`}
          aria-label="Fit width"
        >
          <Maximize2 className="size-4" strokeWidth={1.5} />
        </button>
        <button
          onClick={handleFitPage}
          className={`flex size-8 items-center justify-center rounded-lg transition-colors active:scale-95 ${
            zoomMode === 'page' ? 'bg-accent-light text-accent' : 'text-muted hover:bg-surface-muted hover:text-foreground'
          }`}
          aria-label="Fit page"
        >
          <ChevronsUpDown className="size-4" strokeWidth={1.5} />
        </button>
        <div className="mx-1 h-4 w-px bg-border" />
        <span className="text-xs tabular-nums text-muted">
          {currentPage} / {pageCount}
        </span>
      </div>

      <div ref={containerRef} className="flex-1 overflow-auto p-4">
        <div className="flex flex-col items-center gap-4">
          {Array.from({ length: pageCount }, (_, i) => i + 1).map((pageNum) => (
            <div
              key={pageNum}
              ref={(el) => { if (el) pageRefs.current.set(pageNum, el); }}
              className="relative bg-white shadow-lg"
            >
              <canvas
                id={`pdf-page-${pageNum}`}
                className="block"
              />
              <div className="absolute bottom-2 right-2 rounded bg-black/60 px-2 py-0.5 text-[10px] text-white">
                {pageNum}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}