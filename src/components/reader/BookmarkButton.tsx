'use client';

import { useState, useCallback } from 'react';
import { Bookmark, BookmarkCheck, X } from 'lucide-react';
import { useBookmarks } from '@/hooks/useBookmarks';
import { cn } from '@/lib/utils';

interface BookmarkButtonProps {
  pdfId: string;
  currentPage: number;
}

export function BookmarkButton({ pdfId, currentPage }: BookmarkButtonProps) {
  const { addBookmark, removeBookmark, isBookmarked, getBookmarkForPage } = useBookmarks(pdfId);
  const [showPanel, setShowPanel] = useState(false);
  const [note, setNote] = useState('');

  const bookmarked = isBookmarked(currentPage);
  const existingBookmark = getBookmarkForPage(currentPage);

  const handleToggle = useCallback(() => {
    if (bookmarked && existingBookmark) {
      removeBookmark(existingBookmark.id);
    } else {
      addBookmark(currentPage, note);
      setNote('');
    }
  }, [bookmarked, existingBookmark, currentPage, note, addBookmark, removeBookmark]);

  return (
    <div className="relative">
      <button
        onClick={() => setShowPanel((p) => !p)}
        className={cn(
          'flex size-9 items-center justify-center rounded-lg transition-colors active:scale-95',
          bookmarked ? 'text-accent' : 'text-muted hover:bg-surface-muted hover:text-foreground'
        )}
        aria-label={bookmarked ? 'Remove bookmark' : 'Add bookmark'}
      >
        {bookmarked ? (
          <BookmarkCheck className="size-4" strokeWidth={1.5} />
        ) : (
          <Bookmark className="size-4" strokeWidth={1.5} />
        )}
      </button>

      {showPanel && (
        <div className="absolute right-0 top-full z-50 mt-2 w-64 rounded-xl border border-border bg-white p-3 shadow-lg">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-sm font-medium text-foreground">
              {bookmarked ? 'Edit bookmark' : 'Bookmark page'} {currentPage}
            </span>
            <button
              onClick={() => setShowPanel(false)}
              className="flex size-6 items-center justify-center rounded-lg text-muted hover:bg-surface-muted"
            >
              <X className="size-3.5" strokeWidth={2} />
            </button>
          </div>
          <input
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Add a note (optional)"
            className="mb-2 w-full rounded-lg border border-border bg-surface-muted px-3 py-2 text-sm text-foreground placeholder:text-muted outline-none focus:ring-2 focus:ring-accent/30"
          />
          <button
            onClick={handleToggle}
            className={cn(
              'w-full rounded-lg px-3 py-2 text-sm font-medium transition-colors',
              bookmarked
                ? 'bg-red-50 text-red-600 hover:bg-red-100'
                : 'bg-accent text-white hover:bg-accent-hover'
            )}
          >
            {bookmarked ? 'Remove bookmark' : 'Save bookmark'}
          </button>
        </div>
      )}
    </div>
  );
}