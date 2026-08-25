'use client';

import { useCallback, useRef, useState, type DragEvent, type ChangeEvent } from 'react';
import { Upload, FileText, X, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Button } from './ui/Button';
import { cn } from '@/lib/utils';

interface UploadZoneProps {
  onFileSelect: (file: File) => void;
  isLoading: boolean;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function UploadZone({ onFileSelect, isLoading }: UploadZoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);

  const validateAndSelect = useCallback(
    (file: File) => {
      setError(null);
      if (file.type !== 'application/pdf') {
        setError('Only PDF files are supported');
        return;
      }
      setSelectedFile(file);
    },
    []
  );

  const handleFile = useCallback(
    (file: File) => {
      validateAndSelect(file);
    },
    [validateAndSelect]
  );

  const handleDrop = useCallback(
    (e: DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  const handleDragOver = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleClick = () => {
    inputRef.current?.click();
  };

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    if (inputRef.current) inputRef.current.value = '';
  };

  const handleConfirm = () => {
    if (selectedFile) {
      onFileSelect(selectedFile);
    }
  };

  const handleCancel = () => {
    setSelectedFile(null);
    setError(null);
  };

  if (isLoading) {
    return (
      <div className="rounded-2xl border border-border bg-white p-10 dark:bg-surface-muted">
        <div className="flex flex-col items-center gap-5">
          <div className="relative">
            <div className="size-14 animate-spin rounded-full border-4 border-border" />
            <div className="absolute inset-0 size-14 animate-spin rounded-full border-4 border-transparent border-t-accent" />
          </div>
          <div className="text-center">
            <p className="text-sm font-semibold text-foreground">Processing your PDF</p>
            <p className="mt-1 text-xs text-muted">This may take a moment for large files</p>
          </div>
          <div className="flex items-center gap-6 text-xs text-muted">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="size-3.5 text-accent" />
              Uploaded
            </span>
            <span className="flex items-center gap-1.5">
              <span className="size-1.5 animate-pulse rounded-full bg-accent" />
              Processing
            </span>
            <span className="opacity-50">Ready to read</span>
          </div>
        </div>
      </div>
    );
  }

  if (selectedFile) {
    return (
      <div className="rounded-2xl border border-border bg-white p-6 dark:bg-surface-muted">
        <div className="flex items-center gap-4">
          <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-accent-light shadow-sm">
            <FileText className="size-6 text-accent" strokeWidth={1.5} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-foreground">{selectedFile.name}</p>
            <p className="mt-0.5 text-xs text-muted">{formatFileSize(selectedFile.size)}</p>
          </div>
          <button
            onClick={handleCancel}
            className="flex size-8 shrink-0 items-center justify-center rounded-lg text-muted transition-all duration-150 hover:bg-red-50 hover:text-red-500 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 dark:hover:bg-red-900/20"
            aria-label="Remove file"
          >
            <X className="size-4" strokeWidth={1.5} />
          </button>
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <Button variant="secondary" size="sm" onClick={handleCancel}>
            Cancel
          </Button>
          <Button variant="primary" size="sm" onClick={handleConfirm}>
            Upload &amp; Read
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={handleClick}
        role="button"
        tabIndex={0}
        aria-label="Upload PDF file. Click or drag and drop a PDF here."
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleClick();
          }
        }}
        className={cn(
          'group relative cursor-pointer rounded-2xl border-2 border-dashed p-10 sm:p-14 text-center transition-all duration-300',
          isDragging
            ? 'scale-[1.01] border-accent bg-accent-light/50 shadow-xl shadow-accent/10'
            : 'border-border bg-surface-muted/30 hover:border-accent/40 hover:bg-accent-light/20 hover:shadow-lg hover:shadow-accent/5'
        )}
      >
        <input
          ref={inputRef}
          type="file"
          accept="application/pdf"
          className="hidden"
          onChange={handleInputChange}
        />

        <div className="flex flex-col items-center gap-4">
          <div className={cn('transition-all duration-300', isDragging ? 'scale-110' : 'group-hover:scale-110 group-hover:-translate-y-1')}>
            <div className={cn(
              'flex size-16 items-center justify-center rounded-2xl transition-all duration-300',
              isDragging
                ? 'bg-accent text-white shadow-lg shadow-accent/30'
                : 'bg-accent-light text-accent group-hover:bg-accent group-hover:text-white group-hover:shadow-lg group-hover:shadow-accent/25'
            )}>
              {isDragging ? (
                <FileText className="size-7" strokeWidth={1.5} />
              ) : (
                <Upload className="size-7" strokeWidth={1.5} />
              )}
            </div>
          </div>
          <div>
            <p className="text-base font-semibold text-foreground">
              {isDragging ? 'Drop your PDF here' : 'Drag & drop your PDF'}
            </p>
            <p className="mt-1.5 text-sm text-muted">
              or <span className="font-medium text-accent">click to browse</span>
            </p>
          </div>
        </div>
      </div>

      {error && (
        <div role="alert" className="mt-3 flex items-center gap-2 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-400">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}
    </div>
  );
}
