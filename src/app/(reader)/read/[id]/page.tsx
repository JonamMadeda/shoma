'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Minus, Plus } from 'lucide-react';
import { ReaderView } from '@/components/reader/ReaderView';
import type { ContentBlock } from '@/lib/content-formatter';
import { Button } from '@/components/ui/Button';

const MIN_FONT = 14;
const MAX_FONT = 32;
const STEP = 2;

export default function ReadPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [blocks, setBlocks] = useState<ContentBlock[]>([]);
  const [fontSize, setFontSize] = useState(18);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/pdfs/${id}`);
        if (!res.ok) throw new Error('PDF not found');
        const pdf = await res.json();
        const binary = atob(pdf.content);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
        const { extractPages } = await import('@/lib/pdf-parser');
        const { formatContent } = await import('@/lib/content-formatter');
        const pages = await extractPages(new File([bytes], pdf.filename, { type: 'application/pdf' }));
        setBlocks(formatContent(pages));
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to load PDF');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  const handleBack = useCallback(() => router.push('/'), [router]);

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col">
        <div className="flex flex-1 items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <div className="size-8 animate-spin rounded-full border-[3px] border-slate-200 border-t-slate-700" />
            <p className="text-sm text-slate-400">Preparing reader…</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen flex-col">
        <div className="flex flex-1 flex-col items-center justify-center gap-4 px-4">
          <p className="text-sm text-red-500">{error}</p>
          <Button variant="secondary" onClick={() => router.push('/')}>Back to Library</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-white">
      <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80">
        <div className="mx-auto flex h-12 max-w-3xl items-center justify-between px-4">
          <button
            onClick={handleBack}
            className="flex items-center gap-1.5 text-sm font-medium text-slate-500 transition-colors hover:text-slate-800"
          >
            <ArrowLeft className="size-4" strokeWidth={1.5} />
            Library
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setFontSize(Math.max(MIN_FONT, fontSize - STEP))}
              disabled={fontSize <= MIN_FONT}
              className="flex size-7 items-center justify-center rounded-md text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 disabled:opacity-30 disabled:cursor-not-allowed"
              aria-label="Decrease font size"
            >
              <Minus className="size-3.5" strokeWidth={1.5} />
            </button>
            <span className="w-8 text-center text-xs font-medium text-slate-500 tabular-nums">
              {fontSize}
            </span>
            <button
              onClick={() => setFontSize(Math.min(MAX_FONT, fontSize + STEP))}
              disabled={fontSize >= MAX_FONT}
              className="flex size-7 items-center justify-center rounded-md text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 disabled:opacity-30 disabled:cursor-not-allowed"
              aria-label="Increase font size"
            >
              <Plus className="size-3.5" strokeWidth={1.5} />
            </button>
          </div>
        </div>
      </header>
      <ReaderView blocks={blocks} fontSize={fontSize} />
    </div>
  );
}
