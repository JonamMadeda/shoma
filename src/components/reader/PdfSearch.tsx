'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { Search, X, ChevronUp, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PdfSearchProps {
  blocks: { type: string; text?: string; headers?: string[]; rows?: string[][] }[];
  onMatchFound?: (index: number, total: number) => void;
  onQueryChange?: (query: string) => void;
}

export function PdfSearch({ blocks, onMatchFound, onQueryChange }: PdfSearchProps) {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [matches, setMatches] = useState<{ blockIndex: number; textIndex: number }[]>([]);
  const [currentMatch, setCurrentMatch] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const getAllText = useCallback(() => {
    const texts: { blockIndex: number; text: string }[] = [];
    blocks.forEach((block, i) => {
      if (block.text) texts.push({ blockIndex: i, text: block.text });
      if (block.headers) texts.push({ blockIndex: i, text: block.headers.join(' ') });
      if (block.rows) {
        block.rows.forEach((row) => {
          texts.push({ blockIndex: i, text: row.join(' ') });
        });
      }
    });
    return texts;
  }, [blocks]);

  useEffect(() => {
    onQueryChange?.(query);
    if (!query.trim()) {
      setMatches([]);
      setCurrentMatch(0);
      return;
    }

    const allText = getAllText();
    const lowerQuery = query.toLowerCase();
    const found: { blockIndex: number; textIndex: number }[] = [];

    allText.forEach(({ blockIndex, text }) => {
      let startIndex = 0;
      const lowerText = text.toLowerCase();
      while (startIndex < lowerText.length) {
        const index = lowerText.indexOf(lowerQuery, startIndex);
        if (index === -1) break;
        found.push({ blockIndex, textIndex: index });
        startIndex = index + 1;
      }
    });

    setMatches(found);
    setCurrentMatch(found.length > 0 ? 0 : -1);
    onMatchFound?.(found.length > 0 ? 0 : -1, found.length);
  }, [query, getAllText, onMatchFound, onQueryChange]);

  const handleNext = useCallback(() => {
    if (matches.length === 0) return;
    setCurrentMatch((prev) => {
      const next = (prev + 1) % matches.length;
      onMatchFound?.(next, matches.length);
      return next;
    });
  }, [matches.length, onMatchFound]);

  const handlePrev = useCallback(() => {
    if (matches.length === 0) return;
    setCurrentMatch((prev) => {
      const next = (prev - 1 + matches.length) % matches.length;
      onMatchFound?.(next, matches.length);
      return next;
    });
  }, [matches.length, onMatchFound]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.shiftKey ? handlePrev() : handleNext();
    } else if (e.key === 'Escape') {
      setIsOpen(false);
      setQuery('');
    }
  }, [handleNext, handlePrev]);

  const toggleSearch = useCallback(() => {
    setIsOpen((prev) => !prev);
    if (!isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    } else {
      setQuery('');
    }
  }, [isOpen]);

  return (
    <div className="relative">
      <button
        onClick={toggleSearch}
        className={cn(
          'flex size-9 items-center justify-center rounded-lg transition-colors active:scale-95',
          isOpen ? 'bg-accent-light text-accent' : 'text-muted hover:bg-surface-muted hover:text-foreground'
        )}
        aria-label="Search in document"
      >
        <Search className="size-4" strokeWidth={1.5} />
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full z-50 mt-2 flex items-center gap-1 rounded-xl border border-border bg-white p-1.5 shadow-lg">
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search..."
            className="w-40 rounded-lg border-0 bg-surface-muted px-3 py-1.5 text-sm text-foreground placeholder:text-muted outline-none focus:ring-2 focus:ring-accent/30"
          />
          {query && (
            <span className="px-1 text-xs tabular-nums text-muted">
              {matches.length > 0 ? `${currentMatch + 1}/${matches.length}` : '0/0'}
            </span>
          )}
          <button
            onClick={handlePrev}
            disabled={matches.length === 0}
            className="flex size-7 items-center justify-center rounded-lg text-muted transition-colors hover:bg-surface-muted disabled:opacity-30"
            aria-label="Previous match"
          >
            <ChevronUp className="size-3.5" strokeWidth={2} />
          </button>
          <button
            onClick={handleNext}
            disabled={matches.length === 0}
            className="flex size-7 items-center justify-center rounded-lg text-muted transition-colors hover:bg-surface-muted disabled:opacity-30"
            aria-label="Next match"
          >
            <ChevronDown className="size-3.5" strokeWidth={2} />
          </button>
          <button
            onClick={() => { setIsOpen(false); setQuery(''); }}
            className="flex size-7 items-center justify-center rounded-lg text-muted transition-colors hover:bg-surface-muted"
            aria-label="Close search"
          >
            <X className="size-3.5" strokeWidth={2} />
          </button>
        </div>
      )}
    </div>
  );
}

export function highlightText(text: string, query: string): React.ReactNode {
  if (!query.trim()) return text;
  const parts = text.split(new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi'));
  return parts.map((part, i) =>
    part.toLowerCase() === query.toLowerCase() ? (
      <mark key={i} className="rounded bg-yellow-200 px-0.5 text-foreground dark:bg-yellow-800">
        {part}
      </mark>
    ) : (
      part
    )
  );
}
