'use client';

import { useCallback, useRef, useState, type DragEvent, type ChangeEvent } from 'react';
import { Upload, FileText } from 'lucide-react';

interface UploadZoneProps {
  onFileSelect: (file: File) => void;
  isLoading: boolean;
}

export function UploadZone({ onFileSelect, isLoading }: UploadZoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleFile = useCallback(
    (file: File) => {
      if (file.type !== 'application/pdf') return;
      onFileSelect(file);
    },
    [onFileSelect]
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

  return (
    <div className="flex flex-1 items-center justify-center p-4">
      <div className="w-full max-w-lg">
        <div className="mb-6 text-center">
          <h2 className="font-serif text-2xl font-semibold text-slate-800 sm:text-3xl">
            Upload a PDF
          </h2>
          <p className="mt-2 text-sm text-slate-500">
            Drop a PDF file to extract and read its text
          </p>
        </div>

        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={handleClick}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleClick(); }}
          className={`relative flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-8 sm:p-12 transition-colors ${
            isDragging
              ? 'border-blue-400 bg-blue-50/50'
              : 'border-slate-300 bg-slate-50/50 hover:border-slate-400 hover:bg-slate-100/50'
          }`}
        >
          <input
            ref={inputRef}
            type="file"
            accept="application/pdf"
            className="hidden"
            onChange={handleInputChange}
          />

          {isLoading ? (
            <div className="flex flex-col items-center gap-3">
              <div className="size-10 animate-spin rounded-full border-4 border-slate-200 border-t-blue-500" />
              <p className="text-sm font-medium text-slate-600">Processing PDF…</p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3">
              {isDragging ? (
                <FileText className="size-10 text-blue-500" strokeWidth={1.5} />
              ) : (
                <Upload className="size-10 text-slate-400" strokeWidth={1.5} />
              )}
              <div className="text-center">
                <p className="text-sm font-medium text-slate-700">
                  {isDragging ? 'Drop your PDF here' : 'Drag & drop your PDF here'}
                </p>
                <p className="mt-1 text-xs text-slate-400">or click to browse files</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
