'use client';

import { useState, useEffect } from 'react';

export function useOrientation(): 'portrait' | 'landscape' {
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('portrait');

  useEffect(() => {
    function check() {
      setOrientation(window.innerWidth > window.innerHeight ? 'landscape' : 'portrait');
    }
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  return orientation;
}