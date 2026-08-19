'use client';

import { ChevronRight, Folder, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { EmptyState } from './EmptyState';
import { PdfCard } from './PdfCard';
import type { FolderItem, PdfListItem } from '@/types/library';

interface FolderSectionProps {
  folder: FolderItem;
  pdfs: PdfListItem[];
  totalPdfCount: number;
  expanded: boolean;
  selectMode: boolean;
  selectedIds: Set<string>;
  moveTarget: string | null;
  folders: FolderItem[];
  search: string;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onToggleSelect: (id: string) => void;
  onOpenPdf: (id: string) => void;
  onStartMove: (id: string | null) => void;
  onMovePdf: (pdfId: string, folderId: string | null) => void;
  onDeletePdf: (id: string) => void;
}

export function FolderSection({
  folder,
  pdfs,
  totalPdfCount,
  expanded,
  selectMode,
  selectedIds,
  moveTarget,
  folders,
  search,
  onToggle,
  onDelete,
  onToggleSelect,
  onOpenPdf,
  onStartMove,
  onMovePdf,
  onDeletePdf,
}: FolderSectionProps) {
  return (
    <div className="group overflow-hidden rounded-xl border border-border bg-white transition-all duration-200">
      <div className="flex items-center px-3 py-2.5 sm:px-4 sm:py-3">
        <button
          onClick={() => onToggle(folder.id)}
          className="flex min-w-0 flex-1 items-center gap-2.5 text-left sm:gap-3"
        >
          <div className={cn(
            'flex size-8 shrink-0 items-center justify-center rounded-lg transition-colors duration-200',
            expanded ? 'bg-accent text-white' : 'bg-accent-light text-accent'
          )}>
            <Folder className="size-4" strokeWidth={1.5} />
          </div>
          <div className="min-w-0 flex-1">
            <span className="text-sm font-medium text-foreground">{folder.name}</span>
            <span className="ml-1.5 text-xs tabular-nums text-muted sm:ml-2">
              {totalPdfCount} PDF{totalPdfCount !== 1 ? 's' : ''}
            </span>
          </div>
          <ChevronRight
            className={cn(
              'size-4 shrink-0 text-muted transition-transform duration-200',
              expanded && 'rotate-90'
            )}
            strokeWidth={1.5}
          />
        </button>
        {!selectMode && (
          <button
            onClick={() => onDelete(folder.id)}
            className="ml-1 flex size-8 shrink-0 items-center justify-center rounded-lg text-muted-faint opacity-60 transition-all duration-150 hover:bg-red-50 hover:text-red-500 hover:opacity-100 active:scale-95 sm:ml-2"
            aria-label={`Delete folder ${folder.name}`}
          >
            <Trash2 className="size-4" strokeWidth={1.5} />
          </button>
        )}
      </div>

      {expanded && (
        <div className="border-t border-border-subtle">
          {pdfs.length > 0 ? (
            <div className="divide-y divide-border-subtle px-3 sm:px-4">
              {pdfs.map((pdf) => (
                <PdfCard
                  key={pdf.id}
                  pdf={pdf}
                  selectMode={selectMode}
                  isSelected={selectedIds.has(pdf.id)}
                  moveTarget={moveTarget}
                  folders={folders}
                  onToggleSelect={onToggleSelect}
                  onOpen={onOpenPdf}
                  onStartMove={onStartMove}
                  onMove={onMovePdf}
                  onDelete={onDeletePdf}
                />
              ))}
            </div>
          ) : (
            !search && <div className="px-3 py-2 sm:px-4 sm:py-3"><EmptyState type="empty-folder" folderName={folder.name} /></div>
          )}
        </div>
      )}
    </div>
  );
}
