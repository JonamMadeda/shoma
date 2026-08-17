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
    <div className="fixed bottom-16 left-0 right-0 z-40 bg-white/90 shadow-sm backdrop-blur-sm lg:bottom-0">
      <div className="mx-auto flex max-w-7xl items-center gap-4 border-t border-border px-4 py-3 sm:px-6">
        <span className="text-sm tabular-nums text-accent font-medium">
          {selectedCount} selected
        </span>
        <div className="flex items-center gap-1">
          <span className="text-xs text-muted-faint mr-1">&rarr;</span>
          <button
            onClick={() => onBulkMove(null)}
            className="rounded px-2 py-1 text-xs text-muted-medium hover:bg-surface-muted"
          >
            No folder
          </button>
          {folders.map((f) => (
            <button
              key={f.id}
              onClick={() => onBulkMove(f.id)}
              className="rounded px-2 py-1 text-xs text-muted-medium hover:bg-surface-muted"
            >
              {f.name}
            </button>
          ))}
        </div>
        <button
          onClick={onBulkDelete}
          className="ml-auto inline-flex items-center gap-1.5 rounded px-2.5 py-1.5 text-xs font-medium text-red-500 transition-colors hover:bg-red-50 hover:text-red-600"
        >
          <Trash2 className="size-3.5" strokeWidth={1.5} />
          Delete
        </button>
      </div>
    </div>
  );
}
