'use client';

import { useEffect, useCallback, useRef } from 'react';

interface UseKeyboardShortcutsOptions {
  onZoomIn?: () => void;
  onZoomOut?: () => void;
  onEscape?: () => void;
  onNextPage?: () => void;
  onPrevPage?: () => void;
  enabled?: boolean;
}

export function useKeyboardShortcuts({
  onZoomIn,
  onZoomOut,
  onEscape,
  onNextPage,
  onPrevPage,
  enabled = true,
}: UseKeyboardShortcutsOptions) {
  const lastKeyTimeRef = useRef(0);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!enabled) return;
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      const now = performance.now();
      const isRepeat = now - lastKeyTimeRef.current < 100;
      lastKeyTimeRef.current = now;

      switch (e.key) {
        case '+':
        case '=':
          if (isRepeat) return;
          e.preventDefault();
          onZoomIn?.();
          break;
        case '-':
        case '_':
          if (isRepeat) return;
          e.preventDefault();
          onZoomOut?.();
          break;
        case 'Escape':
          onEscape?.();
          break;
        case 'ArrowRight':
          if (!e.ctrlKey && !e.metaKey) {
            if (isRepeat) return;
            e.preventDefault();
            onNextPage?.();
          }
          break;
        case 'ArrowLeft':
          if (!e.ctrlKey && !e.metaKey) {
            if (isRepeat) return;
            e.preventDefault();
            onPrevPage?.();
          }
          break;
      }
    },
    [enabled, onZoomIn, onZoomOut, onEscape, onNextPage, onPrevPage]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);
}
