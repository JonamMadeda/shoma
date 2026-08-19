'use client';

import { useState, useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface RenameModalProps {
  open: boolean;
  currentName: string;
  onRename: (newName: string) => void;
  onCancel: () => void;
}

export function RenameModal({ open, currentName, onRename, onCancel }: RenameModalProps) {
  const [name, setName] = useState(currentName);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setName(currentName);
      setTimeout(() => inputRef.current?.select(), 100);
    }
  }, [open, currentName]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (trimmed && trimmed !== currentName) {
      onRename(trimmed);
    }
    onCancel();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="mx-4 w-full max-w-sm rounded-2xl border border-border bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-semibold text-foreground">Rename PDF</h2>
          <button
            onClick={onCancel}
            className="flex size-8 items-center justify-center rounded-lg text-muted hover:bg-surface-muted"
          >
            <X className="size-4" strokeWidth={1.5} />
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <input
            ref={inputRef}
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mb-4 w-full rounded-xl border border-border bg-white px-4 py-3 text-sm text-foreground outline-none focus:ring-2 focus:ring-accent/30"
            placeholder="PDF name"
          />
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 rounded-xl border border-border px-4 py-2.5 text-sm font-medium text-muted transition-colors hover:bg-surface-muted"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!name.trim() || name.trim() === currentName}
              className="flex-1 rounded-xl bg-accent px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-accent-hover disabled:opacity-50"
            >
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}