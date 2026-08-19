'use client';

import { useEffect, useRef, useCallback } from 'react';

const STORAGE_KEY = 'reading-stats';

interface ReadingStats {
  totalTime: number; // seconds
  sessions: number;
  lastRead: number;
  pagesRead: Set<number>;
}

export function useReadingStats(pdfId: string) {
  const startTimeRef = useRef<number>(Date.now());
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const getStats = useCallback((): ReadingStats => {
    try {
      const data = localStorage.getItem(`${STORAGE_KEY}:${pdfId}`);
      if (data) {
        const parsed = JSON.parse(data);
        return {
          ...parsed,
          pagesRead: new Set(parsed.pagesRead || []),
        };
      }
    } catch {
      // Ignore errors
    }
    return { totalTime: 0, sessions: 0, lastRead: 0, pagesRead: new Set() };
  }, [pdfId]);

  const saveStats = useCallback((stats: ReadingStats) => {
    try {
      const data = {
        ...stats,
        pagesRead: Array.from(stats.pagesRead),
      };
      localStorage.setItem(`${STORAGE_KEY}:${pdfId}`, JSON.stringify(data));
    } catch {
      // Ignore errors
    }
  }, [pdfId]);

  const trackPage = useCallback((page: number) => {
    const stats = getStats();
    stats.pagesRead.add(page);
    saveStats(stats);
  }, [getStats, saveStats]);

  useEffect(() => {
    startTimeRef.current = Date.now();

    // Update stats every 10 seconds
    intervalRef.current = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
      if (elapsed > 0) {
        const stats = getStats();
        stats.totalTime += elapsed;
        stats.sessions += 1;
        stats.lastRead = Date.now();
        saveStats(stats);
        startTimeRef.current = Date.now();
      }
    }, 10000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);

      // Save final stats on unmount
      const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
      if (elapsed > 0) {
        const stats = getStats();
        stats.totalTime += elapsed;
        stats.sessions += 1;
        stats.lastRead = Date.now();
        saveStats(stats);
      }
    };
  }, [pdfId, getStats, saveStats]);

  return { getStats, trackPage };
}

export function formatTime(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
  const hours = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  return `${hours}h ${mins}m`;
}