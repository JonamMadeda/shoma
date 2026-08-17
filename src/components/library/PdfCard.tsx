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
          'flex cursor-pointer items-center gap-4 rounded-lg border px-4 py-3 transition-colors',
          isSelected
            ? 'border-accent bg-accent-light'
            : 'border-border-subtle bg-white hover:bg-surface-muted'
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
    <div className="group relative rounded-lg border border-border-subtle bg-white shadow-xs transition-all duration-200 hover:border-border hover:shadow-md hover:scale-[1.01]">
      <div className="absolute inset-y-0 left-0 w-0.5 rounded-l-lg bg-accent opacity-0 transition-opacity duration-200 group-hover:opacity-100" />
      <button
        onClick={() => onOpen(pdf.id)}
        className="flex w-full items-center gap-4 px-4 py-3 text-left"
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
        <ChevronRight className="size-3.5 shrink-0 text-muted-faint opacity-0 transition-all duration-200 group-hover:opacity-100 group-hover:translate-x-0.5" strokeWidth={1.5} />
      </button>

      {moveTarget === pdf.id ? (
        <div className="flex items-center gap-2 border-t border-border-subtle px-4 py-2.5">
          <button
            onClick={(e) => { e.stopPropagation(); onMove(pdf.id, null); }}
            className="rounded-md px-2.5 py-1 text-xs text-muted-medium hover:bg-surface-muted"
          >
            No folder
          </button>
          {folders
            .filter((f) => f.id !== pdf.folderId)
            .map((f) => (
              <button
                key={f.id}
                onClick={(e) => { e.stopPropagation(); onMove(pdf.id, f.id); }}
                className="rounded-md px-2.5 py-1 text-xs text-muted-medium hover:bg-surface-muted"
              >
                {f.name}
              </button>
            ))}
          <button
            onClick={(e) => { e.stopPropagation(); onStartMove(null); }}
            className="rounded-md px-2.5 py-1 text-xs text-muted hover:bg-surface-muted"
          >
            Cancel
          </button>
        </div>
      ) : (
        <div className="absolute right-2 top-2 flex gap-0.5 opacity-0 transition-all duration-200 group-hover:opacity-100 group-hover:translate-y-0 translate-y-0.5">
          {folders.length > 0 && (
            <button
              onClick={(e) => { e.stopPropagation(); onStartMove(moveTarget === pdf.id ? null : pdf.id); }}
              className="flex size-7 items-center justify-center rounded-md text-muted-faint hover:bg-surface-muted hover:text-muted-medium"
              aria-label="Move PDF"
            >
              <Move className="size-3.5" strokeWidth={1.5} />
            </button>
          )}
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(pdf.id); }}
            className="flex size-7 items-center justify-center rounded-md text-muted-faint hover:bg-red-50 hover:text-red-500"
            aria-label="Delete PDF"
          >
            <Trash2 className="size-3.5" strokeWidth={1.5} />
          </button>
        </div>
      )}
    </div>
  );
}