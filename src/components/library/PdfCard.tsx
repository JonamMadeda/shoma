'use client';

import { FileText, ChevronRight, Move, Trash2, Check } from 'lucide-react';
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
        className="flex w-full items-center gap-3 py-3 text-left sm:gap-4"
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
        <ChevronRight className="size-4 shrink-0 text-muted-faint sm:opacity-0 sm:transition-all sm:duration-200 sm:group-hover:opacity-100 sm:group-hover:translate-x-0.5" strokeWidth={1.5} />
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
        <div className="absolute right-0 top-3 hidden items-center gap-0.5 opacity-0 transition-all duration-200 group-hover:opacity-100 sm:flex">
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
      )}
    </div>
  );
}