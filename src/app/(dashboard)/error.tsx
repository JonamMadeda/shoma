'use client';

import { AlertCircle, RefreshCw } from 'lucide-react';

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
      <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-red-200 py-16">
        <AlertCircle className="mb-4 size-10 text-red-400" strokeWidth={1.5} />
        <p className="text-sm font-medium text-red-600">Something went wrong</p>
        <p className="mt-1 text-xs text-red-400">{error.message}</p>
        <button
          onClick={reset}
          className="mt-5 inline-flex items-center gap-1.5 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700"
        >
          <RefreshCw className="size-4" strokeWidth={1.5} />
          Try again
        </button>
      </div>
    </div>
  );
}
