'use client';

import { useEffect, useRef, useState } from 'react';
import { Button } from './Button';

interface FolderCreateModalProps {
  open: boolean;
  onCreate: (name: string) => void;
  onCancel: () => void;
}

export function FolderCreateModal({ open, onCreate, onCancel }: FolderCreateModalProps) {
  const [name, setName] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setName('');
      const timer = setTimeout(() => inputRef.current?.focus(), 100);
      return () => clearTimeout(timer);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open, onCancel]);

  if (!open) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (trimmed) {
      onCreate(trimmed);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" role="dialog" aria-modal="true" aria-labelledby="folder-create-title">
      <div className="fixed inset-0 bg-black/40" onClick={onCancel} />
      <div className="relative z-10 mx-4 w-full max-w-sm rounded-xl bg-white p-6 shadow-lg">
        <h3 id="folder-create-title" className="text-sm font-semibold text-foreground">New folder</h3>
        <form onSubmit={handleSubmit} className="mt-4">
          <input
            ref={inputRef}
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Folder name"
            className="block w-full rounded-lg border border-border bg-white px-3 py-2 text-sm text-foreground placeholder-muted transition-colors focus:border-muted focus:outline-none focus:ring-1 focus:ring-muted"
          />
          <div className="mt-5 flex justify-end gap-2">
            <Button variant="secondary" size="sm" type="button" onClick={onCancel}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" type="submit" disabled={!name.trim()}>
              Create
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
