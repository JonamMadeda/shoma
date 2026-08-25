'use client';

import { Trash2 } from 'lucide-react';
import type { FolderItem } from '@/types/library';

interface MultiSelectActionBarProps {
  selectedCount: number;
  folders: FolderItem[];
  onBulkMove: (folderId: string | null) => void;
  onBulkDelete: () => void;
}

export function MultiSelectActionBar({
  selectedCount,
  folders,
  onBulkMove,
  onBulkDelete,
}: MultiSelectActionBarProps) {
  return (
    <div role="toolbar" aria-label="Bulk actions" className="fixed bottom-16 left-0 right-0 z-[55] bg-white/95 shadow-lg backdrop-blur-md dark:bg-sidebar/95 lg:bottom-0">
      <div className="mx-auto flex max-w-7xl flex-col gap-3 border-t border-border px-4 py-3 sm:flex-row sm:items-center sm:gap-4 sm:px-6">
        <span aria-live="polite" className="text-sm tabular-nums text-accent font-medium">
          {selectedCount} selected
        </span>
        <div className="flex items-center gap-1 overflow-x-auto">
          <button
            onClick={() => onBulkMove(null)}
            className="shrink-0 rounded-lg px-3 py-2 text-xs font-medium text-muted-medium transition-colors hover:bg-surface-muted active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50"
          >
            No folder
          </button>
          {folders.map((f) => (
            <button
              key={f.id}
              onClick={() => onBulkMove(f.id)}
              className="shrink-0 rounded-lg px-3 py-2 text-xs font-medium text-muted-medium transition-colors hover:bg-surface-muted active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50"
            >
              {f.name}
            </button>
          ))}
        </div>
        <button
          onClick={onBulkDelete}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium text-red-500 transition-colors hover:bg-red-50 hover:text-red-600 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500/50 dark:hover:bg-red-900/20"
        >
          <Trash2 className="size-4" strokeWidth={1.5} />
          Delete
        </button>
      </div>
    </div>
  );
}
