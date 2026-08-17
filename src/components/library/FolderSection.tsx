'use client';

import { ChevronRight, Folder, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { EmptyState } from './EmptyState';
import { PdfCard } from './PdfCard';
import type { FolderItem, PdfListItem } from '@/types/library';

interface FolderSectionProps {
  folder: FolderItem;
  pdfs: PdfListItem[];
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
    <div className="group overflow-hidden rounded-xl border border-border bg-white transition-all duration-200 hover:shadow-sm">
      <div className="flex items-center px-4 py-3">
        <button
          onClick={() => onToggle(folder.id)}
          className="flex min-w-0 flex-1 items-center gap-3 text-left"
        >
          <div className={cn(
            'flex size-8 shrink-0 items-center justify-center rounded-lg transition-colors duration-200',
            expanded ? 'bg-accent text-white' : 'bg-accent-light text-accent'
          )}>
            <Folder className="size-4" strokeWidth={1.5} />
          </div>
          <div className="min-w-0 flex-1">
            <span className="text-sm font-medium text-foreground">{folder.name}</span>
            <span className="ml-2 text-xs tabular-nums text-muted">
              {pdfs.length} PDF{pdfs.length !== 1 ? 's' : ''}
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
            className="ml-2 flex size-7 shrink-0 items-center justify-center rounded-lg text-muted-faint opacity-0 transition-all duration-150 hover:bg-red-50 hover:text-red-500 group-hover:opacity-100"
            aria-label={`Delete folder ${folder.name}`}
          >
            <Trash2 className="size-3.5" strokeWidth={1.5} />
          </button>
        )}
      </div>

      {expanded && (
        <div className="border-t border-border-subtle">
          {pdfs.length > 0 ? (
            <div className="divide-y divide-border-subtle px-4">
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
            !search && <div className="px-4 py-3"><EmptyState type="empty-folder" folderName={folder.name} /></div>
          )}
        </div>
      )}
    </div>
  );
}