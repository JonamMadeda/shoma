'use client';

import { FileText, ChevronRight, Move, Trash2, Check, MoreHorizontal } from 'lucide-react';
import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '@/lib/utils';
import { formatTitle, estimatePages, formatDate } from '@/lib/library-utils';
import type { PdfListItem, FolderItem } from '@/types/library';

interface PdfCardProps {
  pdf: PdfListItem;
  selectMode: boolean;
  isSelected: boolean;
  moveTarget: string | null;
  folders: FolderItem[];
  onToggleSelect: (id: string) => void;
  onOpen: (id: string) => void;
  onStartMove: (id: string | null) => void;
  onMove: (pdfId: string, folderId: string | null) => void;
  onDelete: (id: string) => void;
}

export function PdfCard({
  pdf,
  selectMode,
  isSelected,
  moveTarget,
  folders,
  onToggleSelect,
  onOpen,
  onStartMove,
  onMove,
  onDelete,
}: PdfCardProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuPos, setMenuPos] = useState<{ top: number; right: number } | null>(null);

  useEffect(() => {
    if (!menuOpen) return;
    const close = () => setMenuOpen(false);
    window.addEventListener('scroll', close, { passive: true });
    window.addEventListener('resize', close);
    return () => {
      window.removeEventListener('scroll', close);
      window.removeEventListener('resize', close);
    };
  }, [menuOpen]);

  const openCompactMenu = (event: React.MouseEvent) => {
    event.stopPropagation();
    const rect = event.currentTarget.getBoundingClientRect();
    setMenuPos({ top: rect.bottom + 4, right: window.innerWidth - rect.right });
    setMenuOpen(true);
  };
  if (selectMode) {
    return (
      <div
        onClick={() => onToggleSelect(pdf.id)}
        className={cn(
          'flex cursor-pointer items-center gap-3 rounded-lg px-3 py-3 transition-colors sm:gap-4 sm:px-4',
          isSelected
            ? 'bg-accent-light'
            : 'bg-white hover:bg-surface-muted'
        )}
        role="option"
        aria-selected={isSelected}
      >
        <div className={cn(
          'flex size-5 shrink-0 items-center justify-center rounded border transition-colors',
          isSelected
            ? 'border-accent bg-accent'
            : 'border-border'
        )}>
          {isSelected && <Check className="size-3 text-white" strokeWidth={3} />}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm text-foreground">
            {formatTitle(pdf.title || pdf.filename)}
          </p>
          <p className="text-xs text-muted">
            {estimatePages(pdf.fileSize)} pages &middot; {formatDate(pdf.createdAt)}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="group relative bg-white transition-all duration-200">
      <button
        onClick={() => onOpen(pdf.id)}
        className="flex w-full items-center gap-3 py-3 pr-10 text-left sm:gap-4 sm:pr-12"
        aria-label={`Open ${formatTitle(pdf.title || pdf.filename)}`}
      >
        <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-accent-light transition-colors duration-200 group-hover:bg-accent group-hover:shadow-sm">
          <FileText className="size-4 text-accent transition-colors duration-200 group-hover:text-white" strokeWidth={1.5} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-foreground">
            {formatTitle(pdf.title || pdf.filename)}
          </p>
          <p className="text-xs text-muted">
            {estimatePages(pdf.fileSize)} pages &middot; {formatDate(pdf.createdAt)}
          </p>
        </div>
        <div className={cn(
          'flex size-7 shrink-0 items-center justify-center rounded-full transition-all duration-200',
          'bg-surface-muted text-muted group-hover:bg-accent-light group-hover:text-accent group-hover:translate-x-0.5',
          'sm:opacity-0 sm:group-hover:opacity-100'
        )}>
          <ChevronRight className="size-4" strokeWidth={2} />
        </div>
      </button>

      {moveTarget === pdf.id ? (
        <div className="flex flex-wrap items-center gap-1.5 border-t border-border-subtle pb-2 pt-2">
          <button
            onClick={(e) => { e.stopPropagation(); onMove(pdf.id, null); }}
            className="rounded-lg px-2.5 py-1.5 text-xs font-medium text-muted-medium transition-colors hover:bg-surface-muted active:scale-95"
          >
            No folder
          </button>
          {folders
            .filter((f) => f.id !== pdf.folderId)
            .map((f) => (
              <button
                key={f.id}
                onClick={(e) => { e.stopPropagation(); onMove(pdf.id, f.id); }}
                className="rounded-lg px-2.5 py-1.5 text-xs font-medium text-muted-medium transition-colors hover:bg-surface-muted active:scale-95"
              >
                {f.name}
              </button>
            ))}
          <button
            onClick={(e) => { e.stopPropagation(); onStartMove(null); }}
            className="rounded-lg px-2.5 py-1.5 text-xs font-medium text-muted transition-colors hover:bg-surface-muted active:scale-95"
          >
            Cancel
          </button>
        </div>
      ) : (
        <div className="absolute right-0 top-3 flex items-center gap-0.5">
          <button
            onClick={openCompactMenu}
            className="flex size-8 items-center justify-center rounded-lg text-muted transition-colors hover:bg-surface-muted hover:text-muted-medium active:scale-95 sm:hidden"
            aria-label={`Actions for ${formatTitle(pdf.title || pdf.filename)}`}
            aria-expanded={menuOpen}
          >
            <MoreHorizontal className="size-4" strokeWidth={1.5} />
          </button>
          <div className="hidden items-center gap-0.5 opacity-0 transition-all duration-200 group-hover:opacity-100 sm:flex">
          {folders.length > 0 && (
            <button
              onClick={(e) => { e.stopPropagation(); onStartMove(moveTarget === pdf.id ? null : pdf.id); }}
              className="flex size-8 items-center justify-center rounded-lg text-muted-faint transition-colors hover:bg-surface-muted hover:text-muted-medium active:scale-95"
              aria-label="Move PDF"
            >
              <Move className="size-4" strokeWidth={1.5} />
            </button>
          )}
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(pdf.id); }}
            className="flex size-8 items-center justify-center rounded-lg text-muted-faint transition-colors hover:bg-red-50 hover:text-red-500 active:scale-95"
            aria-label="Delete PDF"
          >
            <Trash2 className="size-4" strokeWidth={1.5} />
          </button>
          </div>
        </div>
      )}
      {menuOpen && menuPos && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-50" onClick={() => setMenuOpen(false)}>
          <div
            className="absolute w-36 overflow-hidden rounded-xl border border-border bg-white p-1 shadow-lg"
            style={{ top: menuPos.top, right: menuPos.right }}
            onClick={(event) => event.stopPropagation()}
          >
            {folders.length > 0 && (
              <button onClick={(event) => { event.stopPropagation(); onStartMove(pdf.id); setMenuOpen(false); }} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-muted-medium hover:bg-surface-muted">
                <Move className="size-4" strokeWidth={1.5} /> Move
              </button>
            )}
            <button onClick={(event) => { event.stopPropagation(); onDelete(pdf.id); setMenuOpen(false); }} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50">
              <Trash2 className="size-4" strokeWidth={1.5} /> Delete
            </button>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
