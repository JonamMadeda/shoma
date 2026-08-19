'use client';

import { useEffect, useCallback } from 'react';

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
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!enabled) return;
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      switch (e.key) {
        case '+':
        case '=':
          e.preventDefault();
          onZoomIn?.();
          break;
        case '-':
        case '_':
          e.preventDefault();
          onZoomOut?.();
          break;
        case 'Escape':
          e.preventDefault();
          onEscape?.();
          break;
        case 'ArrowRight':
          if (!e.ctrlKey && !e.metaKey) {
            e.preventDefault();
            onNextPage?.();
          }
          break;
        case 'ArrowLeft':
          if (!e.ctrlKey && !e.metaKey) {
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