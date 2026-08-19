'use client';

import { useState, useCallback, useEffect } from 'react';

const STORAGE_KEY = 'bookmarks';

export interface Bookmark {
  id: string;
  pdfId: string;
  page: number;
  note: string;
  createdAt: number;
}

export function useBookmarks(pdfId: string) {
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);

  useEffect(() => {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (data) {
        const all: Bookmark[] = JSON.parse(data);
        setBookmarks(all.filter((b) => b.pdfId === pdfId));
      }
    } catch {
      // Ignore errors
    }
  }, [pdfId]);

  const saveAll = useCallback((all: Bookmark[]) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
    } catch {
      // Ignore errors
    }
  }, []);

  const addBookmark = useCallback((page: number, note: string = '') => {
    const bookmark: Bookmark = {
      id: `${pdfId}-${page}-${Date.now()}`,
      pdfId,
      page,
      note,
      createdAt: Date.now(),
    };

    setBookmarks((prev) => {
      const updated = [...prev, bookmark];
      try {
        const data = localStorage.getItem(STORAGE_KEY);
        const all: Bookmark[] = data ? JSON.parse(data) : [];
        saveAll([...all, bookmark]);
      } catch {
        // Ignore errors
      }
      return updated;
    });
  }, [pdfId, saveAll]);

  const removeBookmark = useCallback((id: string) => {
    setBookmarks((prev) => {
      const updated = prev.filter((b) => b.id !== id);
      try {
        const data = localStorage.getItem(STORAGE_KEY);
        const all: Bookmark[] = data ? JSON.parse(data) : [];
        saveAll(all.filter((b) => b.id !== id));
      } catch {
        // Ignore errors
      }
      return updated;
    });
  }, [saveAll]);

  const isBookmarked = useCallback((page: number) => {
    return bookmarks.some((b) => b.page === page);
  }, [bookmarks]);

  const getBookmarkForPage = useCallback((page: number) => {
    return bookmarks.find((b) => b.page === page);
  }, [bookmarks]);

  return { bookmarks, addBookmark, removeBookmark, isBookmarked, getBookmarkForPage };
}