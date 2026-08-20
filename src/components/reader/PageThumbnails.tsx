'use client';

import { useEffect, useRef, useCallback } from 'react';
import { getDocument, GlobalWorkerOptions } from 'pdfjs-dist';
import type { PDFDocumentProxy } from 'pdfjs-dist';
import { PanelLeftClose, PanelLeft } from 'lucide-react';
import { cn } from '@/lib/utils';

GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.mjs',
  import.meta.url
).toString();

interface PageThumbnailsProps {
  pdf: PDFDocumentProxy | null;
  pageCount: number;
  currentPage: number;
  isOpen: boolean;
  onToggle: () => void;
  onPageSelect: (page: number) => void;
}

export function PageThumbnails({
  pdf,
  pageCount,
  currentPage,
  isOpen,
  onToggle,
  onPageSelect,
}: PageThumbnailsProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const renderedRef = useRef<Set<number>>(new Set());

  const renderThumbnail = useCallback(async (pageNum: number) => {
    if (!pdf || renderedRef.current.has(pageNum)) return;
    renderedRef.current.add(pageNum);

    try {
      const page = await pdf.getPage(pageNum);
      const viewport = page.getViewport({ scale: 0.2 });
      const canvas = document.getElementById(`thumb-${pageNum}`) as HTMLCanvasElement | null;
      if (!canvas) return;

      canvas.width = viewport.width;
      canvas.height = viewport.height;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      await page.render({ canvasContext: ctx, viewport, canvas } as any).promise;
    } catch {
      // Ignore render errors for thumbnails
    }
  }, [pdf]);

  useEffect(() => {
    if (!isOpen || !pdf) return;

    const renderVisible = async () => {
      if (!containerRef.current) return;
      const { scrollTop, clientHeight } = containerRef.current;
      const thumbHeight = 120;

      const start = Math.max(1, Math.floor(scrollTop / thumbHeight) + 1);
      const end = Math.min(pageCount, Math.ceil((scrollTop + clientHeight) / thumbHeight) + 1);

      for (let i = start; i <= end; i++) {
        await renderThumbnail(i);
      }
    };

    renderVisible();
    const container = containerRef.current;
    container?.addEventListener('scroll', renderVisible, { passive: true });
    return () => container?.removeEventListener('scroll', renderVisible);
  }, [isOpen, pdf, pageCount, renderThumbnail]);

  useEffect(() => {
    if (!isOpen) return;
    // Scroll to current page when panel opens
    const el = document.getElementById(`thumb-container-${currentPage}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [isOpen, currentPage]);

  return (
    <>
      <button
        onClick={onToggle}
        className={cn(
          'flex size-9 items-center justify-center rounded-lg transition-colors active:scale-95',
          isOpen ? 'bg-accent-light text-accent' : 'text-muted hover:bg-surface-muted hover:text-foreground'
        )}
        aria-label={isOpen ? 'Close thumbnails' : 'Open thumbnails'}
      >
        {isOpen ? (
          <PanelLeftClose className="size-4" strokeWidth={1.5} />
        ) : (
          <PanelLeft className="size-4" strokeWidth={1.5} />
        )}
      </button>

      {isOpen && (
        <div className="absolute bottom-0 left-0 top-11 z-40 w-28 border-r border-border bg-white shadow-lg lg:w-32">
          <div ref={containerRef} className="h-full overflow-y-auto p-2">
            <div className="flex flex-col gap-2">
              {Array.from({ length: pageCount }, (_, i) => i + 1).map((pageNum) => (
                <button
                  key={pageNum}
                  id={`thumb-container-${pageNum}`}
                  onClick={() => {
                    onPageSelect(pageNum);
                    onToggle();
                  }}
                  className={cn(
                    'relative flex flex-col items-center rounded-lg border-2 transition-all',
                    currentPage === pageNum
                      ? 'border-accent shadow-sm'
                      : 'border-transparent hover:border-border'
                  )}
                >
                  <canvas id={`thumb-${pageNum}`} className="block w-full rounded-t" />
                  <span className="py-1 text-[10px] font-medium text-muted">
                    {pageNum}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
