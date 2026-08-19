'use client';

import { useCallback } from 'react';

const STORAGE_KEY = 'reading-progress';

interface ReadingProgress {
  page: number;
  scrollPercent: number;
  timestamp: number;
}

export function useReadingProgress(pdfId: string) {
  const getProgress = useCallback((): ReadingProgress | null => {
    try {
      const data = localStorage.getItem(`${STORAGE_KEY}:${pdfId}`);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  }, [pdfId]);

  const saveProgress = useCallback((page: number, scrollPercent: number) => {
    try {
      const progress: ReadingProgress = { page, scrollPercent, timestamp: Date.now() };
      localStorage.setItem(`${STORAGE_KEY}:${pdfId}`, JSON.stringify(progress));
    } catch {
      // localStorage might be full
    }
  }, [pdfId]);

  const clearProgress = useCallback(() => {
    localStorage.removeItem(`${STORAGE_KEY}:${pdfId}`);
  }, [pdfId]);

  return { getProgress, saveProgress, clearProgress };
}