'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

export function useOrientation(): 'portrait' | 'landscape' {
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('portrait');
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const check = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      setOrientation(window.innerWidth > window.innerHeight ? 'landscape' : 'portrait');
    }, 150);
  }, []);

  useEffect(() => {
    check();
    window.addEventListener('resize', check);
    return () => {
      window.removeEventListener('resize', check);
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [check]);

  return orientation;
}
