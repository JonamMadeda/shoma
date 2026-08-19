'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Minus, Plus, FileText, Image, Download, Pencil } from 'lucide-react';
import { ReaderView } from '@/components/reader/ReaderView';
import { PdfViewer } from '@/components/reader/PdfViewer';
import { PdfSearch } from '@/components/reader/PdfSearch';
import { BookmarkButton } from '@/components/reader/BookmarkButton';
import { RenameModal } from '@/components/ui/RenameModal';
import type { ContentBlock } from '@/lib/content-formatter';
import { Button } from '@/components/ui/Button';
import { useOrientation } from '@/hooks/useOrientation';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { cachePdf, getCachedPdf } from '@/lib/offline-cache';
import { cn } from '@/lib/utils';

const MIN_FONT = 14;
const MAX_FONT = 32;
const STEP = 2;

export default function ReadPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [blocks, setBlocks] = useState<ContentBlock[]>([]);
  const [pdfBytes, setPdfBytes] = useState<Uint8Array | null>(null);
  const [fontSize, setFontSize] = useState(18);
  const [viewMode, setViewMode] = useState<'text' | 'pdf'>('text');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pdfTitle, setPdfTitle] = useState<string>('');
  const [showRename, setShowRename] = useState(false);
  const orientation = useOrientation();
  const isLandscape = orientation === 'landscape';

  // Auto-hide header in landscape
  const [headerVisible, setHeaderVisible] = useState(true);
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const resetHideTimer = useCallback(() => {
    if (!isLandscape) return;
    setHeaderVisible(true);
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    hideTimerRef.current = setTimeout(() => setHeaderVisible(false), 3000);
  }, [isLandscape]);

  useEffect(() => {
    if (isLandscape) resetHideTimer();
    else setHeaderVisible(true);
    return () => { if (hideTimerRef.current) clearTimeout(hideTimerRef.current); };
  }, [isLandscape, resetHideTimer]);

  // Load PDF
  useEffect(() => {
    async function load() {
      try {
        // Try to load from cache first (offline support)
        const cached = await getCachedPdf(id);
        if (cached) {
          const binary = atob(cached.content);
          const bytes = new Uint8Array(binary.length);
          for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
          setPdfBytes(bytes);
          setPdfTitle(cached.title || cached.filename.replace(/\.pdf$/i, ''));
          const { extractPages } = await import('@/lib/pdf-parser');
          const { formatContent } = await import('@/lib/content-formatter');
          const file = new File([bytes], cached.filename, { type: 'application/pdf' });
          const pages = await extractPages(file);
          setBlocks(formatContent(pages));
          setLoading(false);
          return;
        }

        // Fetch from server
        const res = await fetch(`/api/pdfs/${id}`);
        if (!res.ok) throw new Error('PDF not found');
        const pdf = await res.json();
        setPdfTitle(pdf.title || pdf.filename.replace(/\.pdf$/i, ''));
        const binary = atob(pdf.content);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
        setPdfBytes(bytes);

        // Cache for offline use
        await cachePdf(id, pdf.content, pdf.filename, pdf.title || pdf.filename);

        const { extractPages } = await import('@/lib/pdf-parser');
        const { formatContent } = await import('@/lib/content-formatter');
        const file = new File([bytes], pdf.filename, { type: 'application/pdf' });
        const pages = await extractPages(file);
        setBlocks(formatContent(pages));
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to load PDF');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  const handleBack = useCallback(() => router.push('/'), [router]);

  // Keyboard shortcuts
  useKeyboardShortcuts({
    onZoomIn: viewMode === 'text'
      ? () => setFontSize((s) => Math.min(MAX_FONT, s + STEP))
      : undefined,
    onZoomOut: viewMode === 'text'
      ? () => setFontSize((s) => Math.max(MIN_FONT, s - STEP))
      : undefined,
    onEscape: handleBack,
    enabled: !loading && !error,
  });

  // Export text
  const handleExportText = useCallback(() => {
    const text = blocks
      .map((block) => {
        if (block.type === 'heading') return block.text.toUpperCase();
        if (block.type === 'paragraph') return block.text;
        if (block.type === 'table') {
          const header = block.headers.join(' | ');
          const rows = block.rows.map((row) => row.join(' | ')).join('\n');
          return `${header}\n${rows}`;
        }
        return '';
      })
      .join('\n\n');
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'document.txt';
    a.click();
    URL.revokeObjectURL(url);
  }, [blocks]);

  // Rename PDF
  const handleRename = useCallback(async (newName: string) => {
    try {
      await fetch(`/api/pdfs/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: newName }),
      });
      setPdfTitle(newName);
    } catch {
      // Ignore errors
    }
  }, [id]);

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col">
        <div className="flex flex-1 items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <div className="size-8 animate-spin rounded-full border-[3px] border-border border-t-accent" />
            <p className="text-sm text-muted">Preparing reader...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen flex-col">
        <div className="flex flex-1 flex-col items-center justify-center gap-4 px-4">
          <p className="text-sm text-red-500">{error}</p>
          <Button variant="secondary" onClick={() => router.push('/')}>Back to Library</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-white">
      {/* Tap zone to reveal header in landscape */}
      {isLandscape && !headerVisible && (
        <div
          className="fixed top-0 left-0 right-0 z-50 h-8"
          onPointerDown={() => { setHeaderVisible(true); resetHideTimer(); }}
        />
      )}

      {/* Header — auto-hides in landscape */}
      <header
        className={cn(
          'sticky top-0 z-40 border-b border-border/80 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80 transition-all duration-300',
          isLandscape && !headerVisible && 'pointer-events-none -translate-y-full opacity-0'
        )}
      >
        <div className={cn('mx-auto flex h-14 items-center justify-between px-4', isLandscape ? 'max-w-full' : 'max-w-3xl')}>
          <button
            onClick={handleBack}
            className="flex items-center gap-1.5 py-2 text-sm font-medium text-muted-medium transition-colors hover:text-foreground active:scale-95"
          >
            <ArrowLeft className="size-4" strokeWidth={1.5} />
            Library
          </button>

          <div className="flex items-center gap-1 rounded-lg border border-border bg-white p-0.5">
            <button
              onClick={() => setViewMode('text')}
              className={cn(
                'flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-all duration-150',
                viewMode === 'text' ? 'bg-accent text-white shadow-sm' : 'text-muted hover:text-foreground'
              )}
            >
              <FileText className="size-3.5" strokeWidth={1.5} />
              Text
            </button>
            <button
              onClick={() => setViewMode('pdf')}
              className={cn(
                'flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-all duration-150',
                viewMode === 'pdf' ? 'bg-accent text-white shadow-sm' : 'text-muted hover:text-foreground'
              )}
            >
              <Image className="size-3.5" strokeWidth={1.5} />
              PDF
            </button>
          </div>

          <div className="flex items-center gap-1">
            <BookmarkButton pdfId={id} currentPage={1} />

            {viewMode === 'text' && blocks.length > 0 && (
              <PdfSearch blocks={blocks} />
            )}

            {viewMode === 'text' && blocks.length > 0 && (
              <button
                onClick={handleExportText}
                className="flex size-9 items-center justify-center rounded-lg text-muted transition-colors hover:bg-surface-muted hover:text-muted-medium active:scale-95"
                aria-label="Export text"
                title="Export as .txt"
              >
                <Download className="size-4" strokeWidth={1.5} />
              </button>
            )}

            <button
              onClick={() => setShowRename(true)}
              className="flex size-9 items-center justify-center rounded-lg text-muted transition-colors hover:bg-surface-muted hover:text-muted-medium active:scale-95"
              aria-label="Rename PDF"
              title="Rename"
            >
              <Pencil className="size-4" strokeWidth={1.5} />
            </button>

            {viewMode === 'text' ? (
            <div className="flex items-center gap-1">
              <button
                onClick={() => setFontSize(Math.max(MIN_FONT, fontSize - STEP))}
                disabled={fontSize <= MIN_FONT}
                className="flex size-9 items-center justify-center rounded-lg text-muted transition-colors hover:bg-surface-muted hover:text-muted-medium active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed"
                aria-label="Decrease font size"
              >
                <Minus className="size-4" strokeWidth={1.5} />
              </button>
              <span className="w-10 text-center text-sm font-medium text-muted-medium tabular-nums">
                {fontSize}
              </span>
              <button
                onClick={() => setFontSize(Math.min(MAX_FONT, fontSize + STEP))}
                disabled={fontSize >= MAX_FONT}
                className="flex size-9 items-center justify-center rounded-lg text-muted transition-colors hover:bg-surface-muted hover:text-muted-medium active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed"
                aria-label="Increase font size"
              >
                <Plus className="size-4" strokeWidth={1.5} />
              </button>
            </div>
          ) : (
            <div className="w-[76px]" />
          )}
        </div>
        </div>
      </header>

      {viewMode === 'text' ? (
        <ReaderView blocks={blocks} fontSize={fontSize} />
      ) : pdfBytes ? (
        <PdfViewer data={pdfBytes} pdfId={id} />
      ) : null}

      <RenameModal
        open={showRename}
        currentName={pdfTitle}
        onRename={handleRename}
        onCancel={() => setShowRename(false)}
      />
    </div>
  );
}