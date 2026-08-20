'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { getDocument, GlobalWorkerOptions } from 'pdfjs-dist';
import type { PDFDocumentProxy } from 'pdfjs-dist';
import { Minus, Plus, Maximize2, ChevronsUpDown, RotateCw, Search, X, ChevronDown, ChevronUp, MoreHorizontal } from 'lucide-react';
import { useOrientation } from '@/hooks/useOrientation';
import { useReadingProgress } from '@/hooks/useReadingProgress';
import { useReadingStats } from '@/hooks/useReadingStats';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { PageThumbnails } from './PageThumbnails';
import { cn } from '@/lib/utils';

GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.mjs',
  import.meta.url
).toString();

interface PdfViewerProps {
  data: Uint8Array;
  pdfId: string;
  onPageChange?: (page: number) => void;
  onScrollDirection?: (direction: 'up' | 'down') => void;
}

type ZoomMode = 'width' | 'page' | 'custom';

export function PdfViewer({ data, pdfId, onPageChange, onScrollDirection }: PdfViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [pdf, setPdf] = useState<PDFDocumentProxy | null>(null);
  const [pageCount, setPageCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [zoom, setZoom] = useState(100);
  const [zoomMode, setZoomMode] = useState<ZoomMode>('width');
  const [rotation, setRotation] = useState(0);
  const [pageInput, setPageInput] = useState('1');
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchMatches, setSearchMatches] = useState<number[]>([]);
  const [activeMatch, setActiveMatch] = useState(0);
  const [viewMenuOpen, setViewMenuOpen] = useState(false);
  const viewMenuRef = useRef<HTMLDivElement>(null);
  const [renderVersion, setRenderVersion] = useState(0);
  const pageRefs = useRef<Map<number, HTMLDivElement>>(new Map());
  const lastScrollTopRef = useRef(0);
  const renderingRef = useRef<Set<number>>(new Set());
  const renderedVersionRef = useRef<Map<number, number>>(new Map());
  const hasRestoredProgressRef = useRef(false);
  const orientation = useOrientation();
  const isLandscape = orientation === 'landscape';
  const { getProgress, saveProgress } = useReadingProgress(pdfId);
  const { trackPage } = useReadingStats(pdfId);
  const [thumbnailsOpen, setThumbnailsOpen] = useState(false);

  const [toolbarVisible, setToolbarVisible] = useState(true);

  useEffect(() => {
    if (!viewMenuOpen) return;
    const closeOnOutsidePointer = (event: PointerEvent) => {
      if (!viewMenuRef.current?.contains(event.target as Node)) setViewMenuOpen(false);
    };
    document.addEventListener('pointerdown', closeOnOutsidePointer);
    return () => document.removeEventListener('pointerdown', closeOnOutsidePointer);
  }, [viewMenuOpen]);

  // Load PDF
  useEffect(() => {
    let cancelled = false;
    let documentProxy: PDFDocumentProxy | null = null;
    getDocument({ data: new Uint8Array(data) }).promise.then((doc) => {
      documentProxy = doc;
      if (!cancelled) {
        setPdf(doc);
        setPageCount(doc.numPages);
        setCurrentPage(1);
        renderedVersionRef.current.clear();
        setRenderVersion((version) => version + 1);
      }
    }).catch(() => {
      if (!cancelled) {
        setPdf(null);
        setPageCount(0);
      }
    });
    return () => {
      cancelled = true;
      documentProxy?.cleanup();
    };
  }, [data]);

  const renderPage = useCallback(async (pageNum: number, version: number) => {
    if (!pdf || renderedVersionRef.current.get(pageNum) === version || renderingRef.current.has(pageNum)) return;
    renderingRef.current.add(pageNum);

    try {
      const page = await pdf.getPage(pageNum);
      const baseViewport = page.getViewport({ scale: 1, rotation });
      const container = containerRef.current;
      if (!container) return;
      const availableWidth = Math.max(1, container.clientWidth - (isLandscape ? 8 : 32));
      const widthScale = availableWidth / baseViewport.width;
      const pageScale = Math.min(widthScale, Math.max(1, (container.clientHeight - 32) / baseViewport.height));
      const scale = zoomMode === 'width'
        ? widthScale
        : zoomMode === 'page'
          ? pageScale
          : widthScale * (zoom / 100);
      const pixelRatio = window.devicePixelRatio || 1;
      const viewport = page.getViewport({ scale: scale * pixelRatio, rotation });
      const canvas = document.getElementById(`pdf-page-${pageNum}`) as HTMLCanvasElement | null;
      if (!canvas) return;

      canvas.width = viewport.width;
      canvas.height = viewport.height;
      canvas.style.width = `${viewport.width / pixelRatio}px`;
      canvas.style.height = `${viewport.height / pixelRatio}px`;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      await page.render({ canvasContext: ctx, viewport, canvas } as any).promise;
      renderedVersionRef.current.set(pageNum, version);
    } finally {
      renderingRef.current.delete(pageNum);
    }
  }, [pdf, isLandscape, rotation, zoom, zoomMode]);

  // Keep rendering bounded: the current page and a small reading buffer are enough
  // for continuous scrolling, while avoiding canvases for an entire long document.
  const renderVisiblePages = useCallback(async () => {
    if (!pdf) return;
    const start = Math.max(1, currentPage - 2);
    const end = Math.min(pageCount, currentPage + 2);
    for (let i = start; i <= end; i++) {
      await renderPage(i, renderVersion);
    }
  }, [currentPage, pdf, pageCount, renderPage, renderVersion]);

  useEffect(() => {
    renderVisiblePages().then(() => {
      // Restore once; rerendering for a zoom or resize must not jump the reader back.
      const progress = !hasRestoredProgressRef.current && getProgress();
      if (progress) {
        const el = pageRefs.current.get(progress.page);
        if (el) {
          el.scrollIntoView({ behavior: 'instant' });
          setCurrentPage(progress.page);
          onPageChange?.(progress.page);
        }
      }
      hasRestoredProgressRef.current = true;
    });
  }, [renderVisiblePages, getProgress, onPageChange]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const observer = new ResizeObserver(() => setRenderVersion((version) => version + 1));
    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  // Scroll tracking
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container;
      const scrollDelta = scrollTop - lastScrollTopRef.current;
      if (Math.abs(scrollDelta) > 8) {
        const direction = scrollDelta > 0 ? 'down' : 'up';
        onScrollDirection?.(direction);
        setToolbarVisible(direction === 'up');
        if (direction === 'down') setThumbnailsOpen(false);
        lastScrollTopRef.current = scrollTop;
      }
      let page = 1;
      for (let i = 1; i <= pageCount; i++) {
        const el = pageRefs.current.get(i);
        if (el && el.offsetTop <= scrollTop + 100) page = i;
      }
      setCurrentPage(page);
      setPageInput(String(page));
      onPageChange?.(page);
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
  }, [pageCount, onPageChange, onScrollDirection, saveProgress, trackPage]);

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
    if (touchRef.current) setRenderVersion((version) => version + 1);
    touchRef.current = null;
  }, []);

  // Zoom handlers
  const handleZoomIn = useCallback(() => { setZoomMode('custom'); setZoom((z) => Math.min(z + 25, 300)); setRenderVersion((version) => version + 1); }, []);
  const handleZoomOut = useCallback(() => { setZoomMode('custom'); setZoom((z) => Math.max(z - 25, 50)); setRenderVersion((version) => version + 1); }, []);
  const handleFitWidth = useCallback(() => { setZoomMode('width'); setRenderVersion((version) => version + 1); }, []);
  const handleFitPage = useCallback(() => { setZoomMode('page'); setRenderVersion((version) => version + 1); }, []);
  const handleRotate = useCallback(() => {
    setRotation((value) => (value + 90) % 360);
    setRenderVersion((version) => version + 1);
  }, []);

  const handlePageSelect = useCallback((page: number) => {
    const el = pageRefs.current.get(page);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  }, []);

  const handlePageJump = useCallback(() => {
    const page = Number(pageInput);
    if (Number.isInteger(page) && page >= 1 && page <= pageCount) handlePageSelect(page);
    else setPageInput(String(currentPage));
  }, [currentPage, handlePageSelect, pageCount, pageInput]);

  useEffect(() => {
    let cancelled = false;
    async function search() {
      const query = searchQuery.trim().toLocaleLowerCase();
      if (!pdf || !query) { setSearchMatches([]); return; }
      const matches: number[] = [];
      for (let page = 1; page <= pageCount; page++) {
        const content = await pdf.getPage(page).then((item) => item.getTextContent());
        if (content.items.some((item) => 'str' in item && item.str.toLocaleLowerCase().includes(query))) matches.push(page);
      }
      if (!cancelled) { setSearchMatches(matches); setActiveMatch(0); if (matches[0]) handlePageSelect(matches[0]); }
    }
    void search();
    return () => { cancelled = true; };
  }, [handlePageSelect, pageCount, pdf, searchQuery]);

  const moveSearchMatch = useCallback((direction: 1 | -1) => {
    if (!searchMatches.length) return;
    setActiveMatch((current) => {
      const next = (current + direction + searchMatches.length) % searchMatches.length;
      handlePageSelect(searchMatches[next]);
      return next;
    });
  }, [handlePageSelect, searchMatches]);

  useKeyboardShortcuts({
    onZoomIn: handleZoomIn,
    onZoomOut: handleZoomOut,
    onNextPage: () => handlePageSelect(Math.min(pageCount, currentPage + 1)),
    onPrevPage: () => handlePageSelect(Math.max(1, currentPage - 1)),
    enabled: pageCount > 0,
  });

  return (
    <div
      className="relative flex min-h-0 flex-1 flex-col bg-muted/30"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onPointerDown={() => setToolbarVisible(true)}
    >
      <div
        className={cn(
          'flex h-11 shrink-0 items-center justify-center gap-1 border-b border-border bg-white px-2 py-1.5 transition-all duration-300 sm:gap-2',
          viewMenuOpen ? 'overflow-visible' : 'overflow-hidden',
          !toolbarVisible && 'pointer-events-none h-0 border-transparent py-0 opacity-0'
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
        <button onClick={() => setSearchOpen((open) => !open)} className={cn('flex size-8 items-center justify-center rounded-lg text-muted hover:bg-surface-muted', searchOpen && 'bg-accent-light text-accent')} aria-label="Search PDF"><Search className="size-4" /></button>
        <button onClick={handleZoomOut} className="flex size-8 items-center justify-center rounded-lg text-muted transition-colors hover:bg-surface-muted hover:text-foreground active:scale-95" aria-label="Zoom out">
          <Minus className="size-4" strokeWidth={1.5} />
        </button>
        <span className="min-w-[3rem] text-center text-xs font-medium tabular-nums text-muted-medium">
          {zoomMode === 'custom' ? `${zoom}%` : 'Fit'}
        </span>
        <button onClick={handleZoomIn} className="flex size-8 items-center justify-center rounded-lg text-muted transition-colors hover:bg-surface-muted hover:text-foreground active:scale-95" aria-label="Zoom in">
          <Plus className="size-4" strokeWidth={1.5} />
        </button>
        <div className="mx-1 hidden h-4 w-px bg-border sm:block" />
        <button onClick={handleFitWidth} className={cn('hidden size-8 items-center justify-center rounded-lg transition-colors active:scale-95 sm:flex', zoomMode === 'width' ? 'bg-accent-light text-accent' : 'text-muted hover:bg-surface-muted hover:text-foreground')} aria-label="Fit width">
          <Maximize2 className="size-4" strokeWidth={1.5} />
        </button>
        <button onClick={handleFitPage} className={cn('hidden size-8 items-center justify-center rounded-lg transition-colors active:scale-95 sm:flex', zoomMode === 'page' ? 'bg-accent-light text-accent' : 'text-muted hover:bg-surface-muted hover:text-foreground')} aria-label="Fit page">
          <ChevronsUpDown className="size-4" strokeWidth={1.5} />
        </button>
        <button onClick={handleRotate} className="hidden size-8 items-center justify-center rounded-lg text-muted transition-colors hover:bg-surface-muted hover:text-foreground sm:flex" aria-label="Rotate clockwise" title="Rotate clockwise">
          <RotateCw className="size-4" strokeWidth={1.5} />
        </button>
        <div className="mx-1 h-4 w-px bg-border" />
        <form onSubmit={(event) => { event.preventDefault(); handlePageJump(); }} className="flex items-center gap-1 text-xs tabular-nums text-muted">
          <input value={pageInput} onChange={(event) => setPageInput(event.target.value)} onBlur={handlePageJump} inputMode="numeric" aria-label="Go to page" className="w-7 rounded border border-border bg-white px-1 py-0.5 text-center text-xs text-foreground outline-none focus:ring-2 focus:ring-accent/30" />
          <span>/ {pageCount}</span>
        </form>
        <div ref={viewMenuRef} className="relative sm:hidden"><button onClick={() => setViewMenuOpen((open) => !open)} className="flex size-8 items-center justify-center rounded-lg text-muted hover:bg-surface-muted" aria-label="PDF view options"><MoreHorizontal className="size-4" /></button>{viewMenuOpen && <div className="absolute right-0 top-full z-50 mt-2 w-44 rounded-xl border border-border bg-white p-1.5 shadow-xl"><button onClick={() => { handleFitWidth(); setViewMenuOpen(false); }} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm hover:bg-surface-muted"><Maximize2 className="size-4" />Fit width</button><button onClick={() => { handleFitPage(); setViewMenuOpen(false); }} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm hover:bg-surface-muted"><ChevronsUpDown className="size-4" />Fit page</button><button onClick={() => { handleRotate(); setViewMenuOpen(false); }} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm hover:bg-surface-muted"><RotateCw className="size-4" />Rotate</button></div>}</div>
      </div>
      {searchOpen && <div className="absolute right-3 top-12 z-40 flex items-center gap-1 rounded-xl border border-border bg-white p-2 shadow-lg"><input autoFocus value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} placeholder="Search PDF" className="w-40 bg-transparent px-2 py-1 text-sm outline-none" /><span className="text-xs text-muted">{searchMatches.length ? `${activeMatch + 1}/${searchMatches.length}` : '0/0'}</span><button onClick={() => moveSearchMatch(-1)} aria-label="Previous result"><ChevronUp className="size-4" /></button><button onClick={() => moveSearchMatch(1)} aria-label="Next result"><ChevronDown className="size-4" /></button><button onClick={() => { setSearchOpen(false); setSearchQuery(''); }} aria-label="Close search"><X className="size-4" /></button></div>}

      {/* Pages */}
      <div ref={containerRef} className="min-h-0 flex-1 overflow-auto" style={{ padding: isLandscape ? '4px' : '16px' }}>
        <div className="flex flex-col items-center" style={{ gap: isLandscape ? '2px' : '16px' }}>
          {Array.from({ length: pageCount }, (_, i) => i + 1).map((pageNum) => (
            <div
              key={pageNum}
              ref={(el) => { if (el) pageRefs.current.set(pageNum, el); }}
              className="relative min-h-[420px] bg-white shadow-lg"
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
