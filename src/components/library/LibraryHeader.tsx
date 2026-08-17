'use client';

import Link from 'next/link';
import { Upload, FolderPlus, X, Check, FileText, Folder } from 'lucide-react';

interface LibraryHeaderProps {
  pdfCount: number;
  folderCount: number;
  loading: boolean;
  selectMode: boolean;
  selectedCount: number;
  onToggleSelect: () => void;
  onToggleFolder: () => void;
  onExitSelectMode: () => void;
}

export function LibraryHeader({
  pdfCount,
  folderCount,
  loading,
  selectMode,
  selectedCount,
  onToggleSelect,
  onToggleFolder,
  onExitSelectMode,
}: LibraryHeaderProps) {
  return (
    <div className="mb-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Your Library
          </h1>
          <p className="mt-1 text-sm text-muted">
            Organize and read your PDF collection
          </p>
        </div>
        <div className="flex items-center gap-2">
          {selectMode ? (
            <button
              onClick={onExitSelectMode}
              className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-white px-3 py-2 text-sm font-medium text-muted-medium transition-all duration-150 hover:bg-surface-muted active:scale-[0.97]"
            >
              <X className="size-4" strokeWidth={1.5} />
              <span className="hidden sm:inline">Done</span>
            </button>
          ) : (
            <>
              {pdfCount > 0 && (
                <button
                  onClick={onToggleSelect}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-white px-3 py-2 text-sm font-medium text-muted-medium transition-all duration-150 hover:bg-surface-muted active:scale-[0.97]"
                  aria-label="Enter select mode"
                >
                  <Check className="size-4" strokeWidth={1.5} />
                  <span className="hidden sm:inline">Select</span>
                </button>
              )}
              <button
                onClick={onToggleFolder}
                className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-white px-3 py-2 text-sm font-medium text-muted-medium transition-all duration-150 hover:bg-surface-muted active:scale-[0.97]"
              >
                <FolderPlus className="size-4" strokeWidth={1.5} />
                <span className="hidden sm:inline">Folder</span>
              </button>
              <Link
                href="/upload"
                className="inline-flex items-center gap-1.5 rounded-lg bg-accent px-3.5 py-2 text-sm font-medium text-white shadow-sm shadow-accent/20 transition-all duration-150 hover:bg-accent-hover active:scale-[0.97]"
              >
                <Upload className="size-4" strokeWidth={1.5} />
                <span className="hidden sm:inline">Upload</span>
              </Link>
            </>
          )}
        </div>
      </div>

      {!loading && !selectMode && (pdfCount > 0 || folderCount > 0) && (
        <div className="mt-4 flex items-center gap-2">
          {pdfCount > 0 && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-accent-light px-2.5 py-1 text-xs font-medium text-accent">
              <FileText className="size-3" strokeWidth={1.5} />
              {pdfCount} PDF{pdfCount !== 1 ? 's' : ''}
            </span>
          )}
          {folderCount > 0 && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-accent-light px-2.5 py-1 text-xs font-medium text-accent">
              <Folder className="size-3" strokeWidth={1.5} />
              {folderCount} folder{folderCount !== 1 ? 's' : ''}
            </span>
          )}
        </div>
      )}

      {selectMode && (
        <div className="mt-4">
          <span className="text-sm font-medium text-accent">
            {selectedCount} selected
          </span>
        </div>
      )}
    </div>
  );
}