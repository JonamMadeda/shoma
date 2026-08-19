'use client';

import Link from 'next/link';
import { Upload, FolderOpen, FileText } from 'lucide-react';

interface EmptyStateProps {
  type: 'no-pdfs' | 'all-in-folders' | 'empty-folder' | 'no-results';
  folderName?: string;
  onClearSearch?: () => void;
}

export function EmptyState({ type, folderName, onClearSearch }: EmptyStateProps) {
  if (type === 'no-pdfs') {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-surface-muted/50 py-20 text-center">
        <div className="relative mb-5">
          <div className="absolute inset-0 rounded-2xl bg-accent/10 blur-xl" />
          <div className="relative flex h-16 w-16 animate-float items-center justify-center rounded-2xl bg-accent-light shadow-sm">
            <FileText className="h-7 w-7 text-accent" strokeWidth={1.5} />
          </div>
        </div>
        <p className="text-base font-semibold text-foreground">No PDFs yet</p>
        <p className="mt-1.5 text-sm text-muted">Upload a PDF to get started</p>
        <Link
          href="/upload"
          className="mt-6 inline-flex items-center gap-2 rounded-xl bg-accent px-5 py-2.5 text-sm font-medium text-white shadow-sm shadow-accent/20 transition-all duration-150 hover:bg-accent-hover active:scale-[0.97]"
        >
          <Upload className="h-4 w-4" strokeWidth={1.5} />
          Upload PDF
        </Link>
      </div>
    );
  }

  if (type === 'all-in-folders') {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-surface-muted/30 py-12 text-center">
        <div className="relative mb-4">
          <div className="absolute inset-0 rounded-xl bg-accent/5 blur-lg" />
          <div className="relative flex h-12 w-12 items-center justify-center rounded-xl bg-accent-light">
            <FolderOpen className="h-5 w-5 text-accent" strokeWidth={1.5} />
          </div>
        </div>
        <p className="text-sm font-medium text-foreground">All organized</p>
        <p className="mt-1 text-xs text-muted">All your PDFs are in folders</p>
      </div>
    );
  }

  if (type === 'no-results') {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-surface-muted/30 py-14 text-center">
        <p className="text-sm font-semibold text-foreground">No matching documents</p>
        <p className="mt-1 text-sm text-muted">Try a different title or clear your search.</p>
        <button onClick={onClearSearch} className="mt-4 rounded-lg px-3 py-2 text-sm font-medium text-accent hover:bg-accent-light">Clear search</button>
      </div>
    );
  }

  return (
    <div className="py-4 text-center">
      <p className="text-xs text-muted">
        Empty{folderName ? ` \u00b7 ${folderName}` : ''}
      </p>
    </div>
  );
}
