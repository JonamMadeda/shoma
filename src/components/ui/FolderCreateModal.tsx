'use client';

import { useEffect, useRef, useState } from 'react';
import { Modal } from './Modal';
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
      setTimeout(() => setName(''), 0);
    }
  }, [open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (trimmed) {
      onCreate(trimmed);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onCancel}
      aria-labelledby="folder-create-title"
    >
      <h3 id="folder-create-title" className="text-sm font-semibold text-foreground">
        New folder
      </h3>
      <form onSubmit={handleSubmit} className="mt-4">
        <input
          ref={inputRef}
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Folder name"
          aria-label="Folder name"
          className="block w-full rounded-lg border border-border bg-white px-3 py-2 text-sm text-foreground placeholder-muted transition-colors focus:border-muted focus:outline-none focus:ring-1 focus:ring-muted dark:bg-surface-muted"
        />
        <div className="mt-5 flex justify-end gap-2">
          <Button variant="secondary" type="button" onClick={onCancel}>
            Cancel
          </Button>
          <Button variant="primary" type="submit" disabled={!name.trim()}>
            Create
          </Button>
        </div>
      </form>
    </Modal>
  );
}
