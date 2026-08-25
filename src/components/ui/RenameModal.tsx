'use client';

import { useState, useEffect, useRef } from 'react';
import { Modal } from './Modal';
import { Button } from './Button';

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
      setTimeout(() => setName(currentName), 0);
      requestAnimationFrame(() => {
        inputRef.current?.select();
      });
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

  return (
    <Modal
      open={open}
      onClose={onCancel}
      aria-labelledby="rename-title"
    >
      <h2 id="rename-title" className="text-base font-semibold text-foreground">
        Rename PDF
      </h2>
      <form onSubmit={handleSubmit} className="mt-4">
        <input
          ref={inputRef}
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          aria-label="PDF name"
          className="mb-4 w-full rounded-xl border border-border bg-white px-4 py-3 text-sm text-foreground outline-none focus:ring-2 focus:ring-accent/30 dark:bg-surface-muted"
          placeholder="PDF name"
        />
        <div className="flex gap-2">
          <Button variant="secondary" type="button" onClick={onCancel} className="flex-1">
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={!name.trim() || name.trim() === currentName}
            className="flex-1"
          >
            Save
          </Button>
        </div>
      </form>
    </Modal>
  );
}
