'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { getDocument, GlobalWorkerOptions } from 'pdfjs-dist';
import type { PDFDocumentProxy } from 'pdfjs-dist';
import { Minus, Plus, Maximize2, ChevronsUpDown } from 'lucide-react';
import { useOrientation } from '@/hooks/useOrientation';
import { useReadingProgress } from '@/hooks/useReadingProgress';
import { useReadingStats } from '@/hooks/useReadingStats';
import { PageThumbnails } from './PageThumbnails';
import { cn } from '@/lib/utils';

GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.mjs',
  import.meta.url
).toString();

interface PdfViewerProps {
  data: Uint8Array;
  pdfId: string;
}

type ZoomMode = 'width' | 'page' | 'custom';

export function PdfViewer({ data, pdfId }: PdfViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [pdf, setPdf] = useState<PDFDocumentProxy | null>(null);
  const [pageCount, setPageCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [zoom, setZoom] = useState(100);
  const [zoomMode, setZoomMode] = useState<ZoomMode>('width');
  const [renderedPages, setRenderedPages] = useState<Set<number>>(new Set());
  const pageRefs = useRef<Map<number, HTMLDivElement>>(new Map());
  const renderingRef = useRef<Set<number>>(new Set());
  const orientation = useOrientation();
  const isLandscape = orientation === 'landscape';
  const { getProgress, saveProgress } = useReadingProgress(pdfId);
  const { trackPage } = useReadingStats(pdfId);
  const [thumbnailsOpen, setThumbnailsOpen] = useState(false);

  // Auto-hide toolbar in landscape
  const [toolbarVisible, setToolbarVisible] = useState(true);
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const resetHideTimer = useCallback(() => {
    if (!isLandscape) return;
    setToolbarVisible(true);
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    hideTimerRef.current = setTimeout(() => setToolbarVisible(false), 3000);
  }, [isLandscape]);

  useEffect(() => {
    if (isLandscape) resetHideTimer();
    else setToolbarVisible(true);
    return () => { if (hideTimerRef.current) clearTimeout(hideTimerRef.current); };
  }, [isLandscape, resetHideTimer]);

  // Load PDF
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
    const containerWidth = containerRef.current.clientWidth - (isLandscape ? 16 : 32);
    return containerWidth / 612;
  }, [pdf, isLandscape]);

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
    renderAllPages().then(() => {
      // Restore reading progress
      const progress = getProgress();
      if (progress) {
        const el = pageRefs.current.get(progress.page);
        if (el) {
          el.scrollIntoView({ behavior: 'instant' });
          setCurrentPage(progress.page);
        }
      }
    });
  }, [renderAllPages, getProgress]);

  useEffect(() => {
    if (zoomMode !== 'custom') setRenderedPages(new Set());
  }, [zoomMode]);

  // Scroll tracking
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container;
      let page = 1;
      for (let i = 1; i <= pageCount; i++) {
        const el = pageRefs.current.get(i);
        if (el && el.offsetTop <= scrollTop + 100) page = i;
      }
      setCurrentPage(page);
      if (isLandscape) resetHideTimer();

      // Track page read
      trackPage(page);

      // Save progress
      const scrollPercent = scrollHeight > clientHeight
        ? Math.round((scrollTop / (scrollHeight - clientHeight)) * 100)
        : 0;
      saveProgress(page, scrollPercent);
    };

    container.addEventListener('scroll', handleScroll, { passive: true });
    return () => container.removeEventListener('scroll', handleScroll);
  }, [pageCount, isLandscape, resetHideTimer]);

  // Touch: pinch-to-zoom only
  const touchRef = useRef<{ dist: number; zoom: number } | null>(null);

  const getTouchDist = (touches: React.TouchList) => {
    const t = touches as unknown as TouchList;
    const dx = t[0].clientX - t[1].clientX;
    const dy = t[0].clientY - t[1].clientY;
    return Math.sqrt(dx * dx + dy * dy);
  };

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      e.preventDefault();
      touchRef.current = { dist: getTouchDist(e.touches), zoom };
    }
  }, [zoom]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 2 && touchRef.current) {
      e.preventDefault();
      const newDist = getTouchDist(e.touches);
      const ratio = newDist / touchRef.current.dist;
      const newZoom = Math.max(50, Math.min(300, Math.round(touchRef.current.zoom * ratio)));
      setZoomMode('custom');
      setZoom(newZoom);
    }
  }, []);

  const handleTouchEnd = useCallback(() => {
    touchRef.current = null;
  }, []);

  // Zoom handlers
  const handleZoomIn = () => { setZoomMode('custom'); setZoom((z) => Math.min(z + 25, 300)); setRenderedPages(new Set()); };
  const handleZoomOut = () => { setZoomMode('custom'); setZoom((z) => Math.max(z - 25, 50)); setRenderedPages(new Set()); };
  const handleFitWidth = () => { setZoomMode('width'); setRenderedPages(new Set()); };
  const handleFitPage = () => { setZoomMode('page'); setRenderedPages(new Set()); };

  const handlePageSelect = useCallback((page: number) => {
    const el = pageRefs.current.get(page);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  }, []);

  return (
    <div
      className="flex flex-1 flex-col bg-muted/30"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Toolbar — auto-hides in landscape */}
      <div
        className={cn(
          'flex items-center justify-center gap-1 border-b border-border bg-white px-2 py-1.5 transition-opacity duration-300 sm:gap-2',
          isLandscape && !toolbarVisible && 'pointer-events-none opacity-0'
        )}
      >
        <PageThumbnails
          pdf={pdf}
          pageCount={pageCount}
          currentPage={currentPage}
          isOpen={thumbnailsOpen}
          onToggle={() => setThumbnailsOpen((p) => !p)}
          onPageSelect={handlePageSelect}
        />
        <button onClick={handleZoomOut} className="flex size-8 items-center justify-center rounded-lg text-muted transition-colors hover:bg-surface-muted hover:text-foreground active:scale-95" aria-label="Zoom out">
          <Minus className="size-4" strokeWidth={1.5} />
        </button>
        <span className="min-w-[3rem] text-center text-xs font-medium tabular-nums text-muted-medium">
          {zoomMode === 'custom' ? `${zoom}%` : 'Fit'}
        </span>
        <button onClick={handleZoomIn} className="flex size-8 items-center justify-center rounded-lg text-muted transition-colors hover:bg-surface-muted hover:text-foreground active:scale-95" aria-label="Zoom in">
          <Plus className="size-4" strokeWidth={1.5} />
        </button>
        <div className="mx-1 h-4 w-px bg-border" />
        <button onClick={handleFitWidth} className={cn('flex size-8 items-center justify-center rounded-lg transition-colors active:scale-95', zoomMode === 'width' ? 'bg-accent-light text-accent' : 'text-muted hover:bg-surface-muted hover:text-foreground')} aria-label="Fit width">
          <Maximize2 className="size-4" strokeWidth={1.5} />
        </button>
        <button onClick={handleFitPage} className={cn('flex size-8 items-center justify-center rounded-lg transition-colors active:scale-95', zoomMode === 'page' ? 'bg-accent-light text-accent' : 'text-muted hover:bg-surface-muted hover:text-foreground')} aria-label="Fit page">
          <ChevronsUpDown className="size-4" strokeWidth={1.5} />
        </button>
        <div className="mx-1 h-4 w-px bg-border" />
        <span className="text-xs tabular-nums text-muted">{currentPage} / {pageCount}</span>
      </div>

      {/* Pages */}
      <div ref={containerRef} className="flex-1 overflow-auto" style={{ padding: isLandscape ? '4px' : '16px' }}>
        <div className="flex flex-col items-center" style={{ gap: isLandscape ? '2px' : '16px' }}>
          {Array.from({ length: pageCount }, (_, i) => i + 1).map((pageNum) => (
            <div
              key={pageNum}
              ref={(el) => { if (el) pageRefs.current.set(pageNum, el); }}
              className="relative bg-white shadow-lg"
            >
              <canvas id={`pdf-page-${pageNum}`} className="block" />
              <div className="absolute bottom-2 right-2 rounded bg-black/60 px-2 py-0.5 text-[10px] text-white">
                {pageNum}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Landscape: floating page indicator */}
      {isLandscape && (
        <div
          className={cn(
            'fixed bottom-4 left-1/2 z-50 -translate-x-1/2 rounded-full bg-black/70 px-4 py-1.5 text-sm font-medium text-white tabular-nums backdrop-blur transition-opacity duration-300',
            toolbarVisible && 'opacity-0 pointer-events-none'
          )}
        >
          {currentPage} / {pageCount}
        </div>
      )}
    </div>
  );
}