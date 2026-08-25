'use client';

import { useEffect } from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Dashboard error:', error);
  }, [error]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
      <div role="alert" className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-red-200 py-16 dark:border-red-800">
        <AlertCircle className="mb-4 size-10 text-red-400" strokeWidth={1.5} />
        <p className="text-sm font-medium text-red-600 dark:text-red-400">Something went wrong</p>
        {process.env.NODE_ENV === 'development' && (
          <p className="mt-1 text-xs text-red-400">{error.message}</p>
        )}
        <button
          onClick={reset}
          className="mt-5 inline-flex items-center gap-1.5 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500/50 focus-visible:ring-offset-2"
        >
          <RefreshCw className="size-4" strokeWidth={1.5} />
          Try again
        </button>
      </div>
    </div>
  );
}
