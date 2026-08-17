'use client';

import { Search, X, ArrowUpDown } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
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

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (sortRef.current && !sortRef.current.contains(e.target as Node)) {
        setSortOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="mb-6">
      <div className="flex items-center gap-3">
        <div className="group relative flex-1">
          <div className="flex items-center gap-2.5 rounded-xl border border-border bg-white px-4 py-2.5 transition-all duration-200 focus-within:border-accent focus-within:shadow-md focus-within:shadow-accent/5 focus-within:ring-2 focus-within:ring-accent/20">
            <Search className="size-4 shrink-0 text-muted transition-colors duration-200 group-focus-within:text-accent" strokeWidth={1.5} />
            <input
              type="text"
              placeholder="Search your library..."
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              className="min-w-0 flex-1 bg-transparent text-sm text-foreground placeholder-muted focus:outline-none"
              aria-label="Search documents"
            />
            {search && (
              <button
                onClick={() => onSearchChange('')}
                className="rounded-md p-0.5 text-muted transition-colors hover:bg-surface-muted hover:text-foreground"
                aria-label="Clear search"
              >
                <X className="size-3.5" strokeWidth={1.5} />
              </button>
            )}
          </div>
        </div>

        <div className="relative" ref={sortRef}>
          <button
            onClick={() => setSortOpen(!sortOpen)}
            className={cn(
              'inline-flex items-center gap-1.5 rounded-xl border bg-white px-3 py-2.5 text-sm font-medium transition-all duration-150 active:scale-[0.97]',
              sortOpen
                ? 'border-accent text-accent shadow-sm'
                : 'border-border text-muted-medium hover:border-muted hover:bg-surface-muted'
            )}
          >
            <ArrowUpDown className="size-3.5" strokeWidth={1.5} />
            <span className="hidden sm:inline">{sortOptions.find(o => o.value === sort)?.label}</span>
          </button>

          {sortOpen && (
            <div className="absolute right-0 top-full z-10 mt-1 w-32 overflow-hidden rounded-xl border border-border bg-white shadow-lg">
              {sortOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => {
                    onSortChange(option.value);
                    setSortOpen(false);
                  }}
                  className={cn(
                    'flex w-full items-center px-3 py-2 text-sm transition-colors',
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