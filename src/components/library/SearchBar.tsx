'use client';

import { Search, X, ArrowUpDown } from 'lucide-react';
import { useState, useRef, useEffect, useCallback } from 'react';
import { cn } from '@/lib/utils';
import type { SortKey } from '@/types/library';

interface SearchBarProps {
  search: string;
  sort: SortKey;
  onSearchChange: (value: string) => void;
  onSortChange: (value: SortKey) => void;
}

const sortOptions: { value: SortKey; label: string }[] = [
  { value: 'date', label: 'Date' },
  { value: 'name', label: 'Name' },
];

export function SearchBar({ search, sort, onSearchChange, onSortChange }: SearchBarProps) {
  const [sortOpen, setSortOpen] = useState(false);
  const sortRef = useRef<HTMLDivElement>(null);

  const handleClickOutside = useCallback((e: MouseEvent | TouchEvent) => {
    if (sortRef.current && !sortRef.current.contains(e.target as Node)) {
      setSortOpen(false);
    }
  }, []);

  useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [handleClickOutside]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === '/' && document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA') {
        event.preventDefault();
        document.getElementById('library-search')?.focus();
      }
      if (event.key === 'Escape') setSortOpen(false);
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="mb-7 rounded-2xl border border-border bg-white p-2 shadow-sm dark:bg-surface-muted sm:mb-9 sm:p-3">
      <div className="flex items-center gap-2 sm:gap-3">
        <div className="group relative min-w-0 flex-1">
          <div className="flex items-center gap-2.5 rounded-xl bg-surface-muted/70 px-3 py-2.5 transition-all duration-200 focus-within:bg-white focus-within:ring-2 focus-within:ring-accent/20 dark:focus-within:bg-surface-muted sm:px-4 sm:py-3">
            <Search className="size-4 shrink-0 text-muted transition-colors duration-200 group-focus-within:text-accent" strokeWidth={1.5} />
            <input
              id="library-search"
              type="text"
              placeholder="Search..."
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              className="min-w-0 flex-1 bg-transparent text-sm text-foreground placeholder-muted focus:outline-none"
              aria-label="Search documents"
            />
            {search && (
              <button
                onClick={() => onSearchChange('')}
                className="flex size-8 items-center justify-center rounded-lg text-muted transition-colors hover:bg-surface-muted hover:text-foreground active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50"
                aria-label="Clear search"
              >
                <X className="size-4" strokeWidth={1.5} />
              </button>
            )}
          </div>
        </div>

        <label className="relative w-[76px] shrink-0 sm:hidden">
          <span className="sr-only">Sort documents</span>
          <ArrowUpDown className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted" strokeWidth={1.5} />
          <select
            value={sort}
            onChange={(event) => onSortChange(event.target.value as SortKey)}
            className="h-[42px] w-full appearance-none rounded-xl border border-border bg-white py-2 pl-9 pr-2 text-sm font-medium text-muted-medium focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20 dark:bg-surface-muted"
            aria-label="Sort documents"
          >
            {sortOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
          </select>
        </label>

        <div className="relative hidden sm:block" ref={sortRef}>
          <button
            onClick={() => setSortOpen(!sortOpen)}
            aria-expanded={sortOpen}
            aria-haspopup="listbox"
            className={cn(
              'inline-flex items-center gap-1.5 rounded-xl border bg-white px-3 py-3 text-sm font-medium transition-all duration-150 active:scale-[0.97] dark:bg-surface-muted',
              sortOpen
                ? 'border-accent text-accent shadow-sm'
                : 'border-border text-muted-medium hover:border-muted hover:bg-surface-muted'
            )}
          >
            <ArrowUpDown className="size-4" strokeWidth={1.5} />
            <span>{sortOptions.find(o => o.value === sort)?.label}</span>
          </button>

          {sortOpen && (
            <div role="listbox" aria-label="Sort options" className="absolute right-0 top-full z-[55] mt-1 w-36 overflow-hidden rounded-xl border border-border bg-white shadow-lg dark:bg-surface-muted">
              {sortOptions.map((option) => (
                <button
                  key={option.value}
                  role="option"
                  aria-selected={sort === option.value}
                  onClick={() => {
                    onSortChange(option.value);
                    setSortOpen(false);
                  }}
                  className={cn(
                    'flex w-full items-center px-4 py-2.5 text-sm transition-colors active:bg-surface-muted',
                    sort === option.value
                      ? 'bg-accent-light font-medium text-accent'
                      : 'text-muted-medium hover:bg-surface-muted'
                  )}
                >
                  {option.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
