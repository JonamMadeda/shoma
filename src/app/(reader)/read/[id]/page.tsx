'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Minus, Plus, FileText, Image, Download, Pencil, List, Settings, Sun, Moon, MoreHorizontal } from 'lucide-react';
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
import { useDarkMode } from '@/components/DarkModeProvider';

const MIN_FONT = 14;
const MAX_FONT = 32;
const STEP = 2;

export default function ReadPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [blocks, setBlocks] = useState<ContentBlock[]>([]);
  const [pdfBytes, setPdfBytes] = useState<Uint8Array | null>(null);
  const [textReady, setTextReady] = useState(false);
  const [extracting, setExtracting] = useState(false);
  const [textError, setTextError] = useState(false);
  const [fontSize, setFontSize] = useState(18);
  const [viewMode, setViewMode] = useState<'text' | 'pdf'>('pdf');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pdfTitle, setPdfTitle] = useState<string>('');
  const [showRename, setShowRename] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeSearchMatch, setActiveSearchMatch] = useState(-1);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [tocOpen, setTocOpen] = useState(false);
  const [textWidth, setTextWidth] = useState<'normal' | 'wide'>('normal');
  const [lineHeight, setLineHeight] = useState(1.75);
  const [tocTarget, setTocTarget] = useState<number | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const { resolvedTheme, setTheme } = useDarkMode();
  const orientation = useOrientation();
  const isLandscape = orientation === 'landscape';

  const [headerVisible, setHeaderVisible] = useState(true);

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
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to load PDF');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  const handleBack = useCallback(() => router.push('/'), [router]);
  const handleSearchMatch = useCallback((index: number) => setActiveSearchMatch(index), []);
  const handleReaderScroll = useCallback((direction: 'up' | 'down') => {
    setHeaderVisible(direction === 'up');
  }, []);
  const closeReaderPanels = useCallback(() => {
    if (settingsOpen || tocOpen) {
      setSettingsOpen(false);
      setTocOpen(false);
      return;
    }
    handleBack();
  }, [handleBack, settingsOpen, tocOpen]);

  const ensureTextReady = useCallback(async () => {
    if (textReady || extracting || !pdfBytes) return;
    setExtracting(true);
    setTextError(false);
    try {
      const file = new File([pdfBytes.buffer as ArrayBuffer], 'document.pdf', { type: 'application/pdf' });
      const { extractPages } = await import('@/lib/pdf-parser');
      const { formatContent } = await import('@/lib/content-formatter');
      const pages = await extractPages(file);
      setBlocks(formatContent(pages));
      setTextReady(true);
    } catch {
      setTextError(true);
    } finally {
      setExtracting(false);
    }
  }, [extracting, pdfBytes, textReady]);

  const switchToText = useCallback(() => {
    setViewMode('text');
    void ensureTextReady();
  }, [ensureTextReady]);

  const switchToPdf = useCallback(() => setViewMode('pdf'), []);

  const headings = blocks.flatMap((block, index) => block.type === 'heading' ? [{ ...block, index }] : []);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('reader-preferences');
      if (!saved) return;
      const preferences = JSON.parse(saved) as { fontSize?: number; lineHeight?: number; textWidth?: 'normal' | 'wide' };
      setTimeout(() => {
        if (preferences.fontSize) setFontSize(preferences.fontSize);
        if (preferences.lineHeight) setLineHeight(preferences.lineHeight);
        if (preferences.textWidth) setTextWidth(preferences.textWidth);
      }, 0);
    } catch {
      // Ignore unavailable or malformed local preferences.
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem('reader-preferences', JSON.stringify({ fontSize, lineHeight, textWidth }));
    } catch {
      // Local persistence is optional.
    }
  }, [fontSize, lineHeight, textWidth]);

  // Keyboard shortcuts
  useKeyboardShortcuts({
    onZoomIn: viewMode === 'text'
      ? () => setFontSize((s) => Math.min(MAX_FONT, s + STEP))
      : undefined,
    onZoomOut: viewMode === 'text'
      ? () => setFontSize((s) => Math.max(MIN_FONT, s - STEP))
      : undefined,
    onEscape: viewMode === 'text' ? closeReaderPanels : undefined,
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
      <div className="flex min-h-dvh flex-col">
            <div role="status" aria-label="Loading PDF" className="flex flex-1 items-center justify-center">
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
      <div className="flex min-h-dvh flex-col">
        <div className="flex flex-1 flex-col items-center justify-center gap-4 px-4">
          <p role="alert" className="text-sm text-red-500">{error}</p>
          <Button variant="secondary" onClick={() => router.push('/')}>Back to Library</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex h-dvh min-h-0 flex-col overflow-hidden bg-white dark:bg-background">
      {/* A small reveal zone keeps the navigation reachable without changing the reading position. */}
      {!headerVisible && (
        <div
          className="fixed top-0 left-0 right-0 z-50 h-8"
          onPointerDown={() => setHeaderVisible(true)}
        />
      )}

      {/* Header follows the reading direction. */}
      <header
        className={cn(
          'sticky top-0 z-40 h-14 border-b border-border/80 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80 dark:bg-sidebar/95 transition-all duration-300',
          headerVisible && menuOpen ? 'overflow-visible' : 'overflow-hidden',
          !headerVisible && 'pointer-events-none h-0 border-transparent opacity-0'
        )}
      >
        <div className={cn('mx-auto flex h-14 w-full min-w-0 items-center justify-between gap-2 px-3 sm:px-4', isLandscape ? 'max-w-full' : 'max-w-3xl')}>
          <button
            onClick={handleBack}
            className="flex shrink-0 items-center gap-1.5 py-2 text-sm font-medium text-muted-medium transition-colors hover:text-foreground active:scale-95"
          >
            <ArrowLeft className="size-4" strokeWidth={1.5} />
            <span className="hidden sm:inline">Library</span>
          </button>

          <div className="flex shrink-0 items-center gap-1 rounded-lg border border-border bg-white p-0.5 dark:bg-surface-muted">
            <button
              onClick={switchToPdf}
              className={cn(
                'flex items-center gap-1.5 rounded-md px-2 py-1.5 text-xs font-medium transition-all duration-150 sm:px-3',
                viewMode === 'pdf' ? 'bg-accent text-white shadow-sm' : 'text-muted hover:text-foreground'
              )}
            >
              <Image className="size-3.5" strokeWidth={1.5} />
              <span className="hidden sm:inline">PDF</span>
            </button>
            <button
              onClick={switchToText}
              className={cn(
                'flex items-center gap-1.5 rounded-md px-2 py-1.5 text-xs font-medium transition-all duration-150 sm:px-3',
                viewMode === 'text' ? 'bg-accent text-white shadow-sm' : 'text-muted hover:text-foreground'
              )}
            >
              <FileText className="size-3.5" strokeWidth={1.5} />
              <span className="hidden sm:inline">Text</span>
            </button>
          </div>

          <div className="hidden min-w-0 items-center justify-end gap-1">
            <BookmarkButton pdfId={id} currentPage={currentPage} />

            {viewMode === 'text' && headings.length > 0 && (
              <button onClick={() => setTocOpen((open) => !open)} className="flex size-9 items-center justify-center rounded-lg text-muted transition-colors hover:bg-surface-muted hover:text-foreground" aria-label="Table of contents" title="Table of contents">
                <List className="size-4" strokeWidth={1.5} />
              </button>
            )}

            {viewMode === 'text' && blocks.length > 0 && (
              <PdfSearch blocks={blocks} onQueryChange={setSearchQuery} onMatchFound={handleSearchMatch} />
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
            <button onClick={() => setSettingsOpen((open) => !open)} className={cn('flex size-9 items-center justify-center rounded-lg transition-colors hover:bg-surface-muted hover:text-foreground', settingsOpen && 'bg-accent-light text-accent')} aria-label="Reader settings" title="Reader settings">
              <Settings className="size-4" strokeWidth={1.5} />
            </button>
          ) : (
            <div className="hidden w-[76px] sm:block" />
          )}
        </div>
        <div className="relative">
          <button onClick={() => setMenuOpen((open) => !open)} className={cn('flex size-9 items-center justify-center rounded-lg text-muted hover:bg-surface-muted hover:text-foreground', menuOpen && 'bg-accent-light text-accent')} aria-label="Reader actions" aria-expanded={menuOpen}>
            <MoreHorizontal className="size-5" />
          </button>
          {menuOpen && (
            <div className="absolute right-0 top-full z-[60] mt-2 w-52 rounded-xl border border-border bg-white p-1.5 shadow-xl dark:bg-surface-muted">
              <div className="flex items-center gap-1 border-b border-border px-1 pb-1.5">
                <BookmarkButton pdfId={id} currentPage={currentPage} />
                {viewMode === 'text' && blocks.length > 0 && <PdfSearch blocks={blocks} onQueryChange={setSearchQuery} onMatchFound={handleSearchMatch} />}
                {viewMode === 'text' && headings.length > 0 && <button onClick={() => { setTocOpen(true); setMenuOpen(false); }} className="flex size-9 items-center justify-center rounded-lg text-muted hover:bg-surface-muted" aria-label="Contents"><List className="size-4" /></button>}
              </div>
              {viewMode === 'text' && <button onClick={() => { setSettingsOpen(true); setMenuOpen(false); }} className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-foreground hover:bg-surface-muted"><Settings className="size-4 text-muted" />Reading settings</button>}
              {viewMode === 'text' && <button onClick={() => { handleExportText(); setMenuOpen(false); }} className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-foreground hover:bg-surface-muted"><Download className="size-4 text-muted" />Export text</button>}
              <button onClick={() => { setShowRename(true); setMenuOpen(false); }} className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-foreground hover:bg-surface-muted"><Pencil className="size-4 text-muted" />Rename document</button>
            </div>
          )}
        </div>
        </div>
      </header>

      {viewMode === 'text' && tocOpen && (
          <aside role="dialog" aria-label="Table of contents" className="absolute left-3 top-16 z-30 max-h-[calc(100dvh-5rem)] w-72 overflow-y-auto rounded-xl border border-border bg-white p-2 shadow-xl dark:bg-surface-muted">
          <p className="px-2 py-1.5 text-xs font-semibold uppercase tracking-wide text-muted">Contents</p>
          {headings.map((heading) => (
            <button key={heading.index} onClick={() => { setTocTarget(heading.index); setTocOpen(false); }} className="block w-full rounded-lg px-2 py-2 text-left text-sm text-foreground hover:bg-surface-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40" style={{ paddingLeft: `${8 + (heading.level - 1) * 12}px` }}>
              {heading.text}
            </button>
          ))}
        </aside>
      )}

      {viewMode === 'text' && settingsOpen && (
        <aside role="dialog" aria-label="Reading settings" className="absolute right-3 top-16 z-30 w-72 rounded-xl border border-border bg-white p-4 shadow-xl dark:bg-surface-muted">
          <p className="mb-3 text-sm font-semibold text-foreground">Reading settings</p>
          <div className="mb-4 flex items-center justify-between"><span className="text-sm text-muted-medium">Text size</span><div className="flex items-center gap-2"><button onClick={() => setFontSize((size) => Math.max(MIN_FONT, size - STEP))} disabled={fontSize <= MIN_FONT} className="rounded-lg border border-border p-1.5 disabled:opacity-40 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50" aria-label="Decrease font size"><Minus className="size-4" /></button><span className="w-8 text-center text-sm tabular-nums">{fontSize}</span><button onClick={() => setFontSize((size) => Math.min(MAX_FONT, size + STEP))} disabled={fontSize >= MAX_FONT} className="rounded-lg border border-border p-1.5 disabled:opacity-40 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50" aria-label="Increase font size"><Plus className="size-4" /></button></div></div>
          <label className="mb-4 block text-sm text-muted-medium">Line spacing<input type="range" min="1.4" max="2.1" step="0.1" value={lineHeight} onChange={(event) => setLineHeight(Number(event.target.value))} className="mt-2 w-full accent-accent" /></label>
          <div className="mb-4"><p className="mb-2 text-sm text-muted-medium">Text width</p><div className="grid grid-cols-2 gap-2"><button onClick={() => setTextWidth('normal')} className={cn('rounded-lg border px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50', textWidth === 'normal' && 'border-accent bg-accent-light text-accent')}>Comfort</button><button onClick={() => setTextWidth('wide')} className={cn('rounded-lg border px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50', textWidth === 'wide' && 'border-accent bg-accent-light text-accent')}>Wide</button></div></div>
          <div><p className="mb-2 text-sm text-muted-medium">Appearance</p><div className="grid grid-cols-2 gap-2"><button onClick={() => setTheme('light')} className={cn('flex items-center justify-center gap-2 rounded-lg border px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50', resolvedTheme === 'light' && 'border-accent bg-accent-light text-accent')}><Sun className="size-4" />Light</button><button onClick={() => setTheme('dark')} className={cn('flex items-center justify-center gap-2 rounded-lg border px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50', resolvedTheme === 'dark' && 'border-accent bg-accent-light text-accent')}><Moon className="size-4" />Dark</button></div></div>
        </aside>
      )}

      {viewMode === 'text' ? (
        extracting || !textReady ? (
          <div role="status" aria-label="Extracting text" className="flex flex-1 flex-col items-center justify-center gap-3 bg-white dark:bg-background">
            <div className="size-8 animate-spin rounded-full border-[3px] border-border border-t-accent" />
            <p className="text-sm text-muted">{textError ? 'Failed to extract text' : 'Extracting text...'}</p>
          </div>
        ) : (
        <ReaderView
          blocks={blocks}
          fontSize={fontSize}
          searchQuery={searchQuery}
          activeMatch={activeSearchMatch}
          onActivePageChange={setCurrentPage}
          onScrollDirection={handleReaderScroll}
          textWidth={textWidth}
          lineHeight={lineHeight}
          scrollToBlock={tocTarget}
          headerVisible={headerVisible}
        />
        )
      ) : pdfBytes ? (
        <PdfViewer data={pdfBytes} pdfId={id} onPageChange={setCurrentPage} onScrollDirection={handleReaderScroll} />
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
