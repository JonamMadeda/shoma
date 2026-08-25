'use client';

import { useState, useCallback, useEffect, useRef } from 'react';

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
  const bookmarksRef = useRef<Bookmark[]>([]);

  useEffect(() => {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (data) {
        const all: Bookmark[] = JSON.parse(data);
        const filtered = all.filter((b) => b.pdfId === pdfId);
        setTimeout(() => {
          setBookmarks(filtered);
          bookmarksRef.current = filtered;
        }, 0);
      }
    } catch {
      try { localStorage.removeItem(STORAGE_KEY); } catch { /* ignore */ }
    }
  }, [pdfId]);

  const saveAll = useCallback((all: Bookmark[]) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
      return true;
    } catch {
      return false;
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

    const currentAll = bookmarksRef.current;
    const updatedAll = [...currentAll, bookmark];

    setBookmarks(updatedAll);
    bookmarksRef.current = updatedAll;

    try {
      const data = localStorage.getItem(STORAGE_KEY);
      const all: Bookmark[] = data ? JSON.parse(data) : [];
      saveAll([...all.filter((b) => !(b.pdfId === pdfId && b.page === page)), bookmark]);
    } catch {
      setBookmarks(currentAll);
      bookmarksRef.current = currentAll;
    }
  }, [pdfId, saveAll]);

  const removeBookmark = useCallback((id: string) => {
    const currentAll = bookmarksRef.current;
    const updatedAll = currentAll.filter((b) => b.id !== id);

    setBookmarks(updatedAll);
    bookmarksRef.current = updatedAll;

    try {
      const data = localStorage.getItem(STORAGE_KEY);
      const all: Bookmark[] = data ? JSON.parse(data) : [];
      saveAll(all.filter((b) => b.id !== id));
    } catch {
      setBookmarks(currentAll);
      bookmarksRef.current = currentAll;
    }
  }, [saveAll]);

  const isBookmarked = useCallback((page: number) => {
    return bookmarks.some((b) => b.page === page);
  }, [bookmarks]);

  const getBookmarkForPage = useCallback((page: number) => {
    return bookmarks.find((b) => b.page === page);
  }, [bookmarks]);

  return { bookmarks, addBookmark, removeBookmark, isBookmarked, getBookmarkForPage };
}
