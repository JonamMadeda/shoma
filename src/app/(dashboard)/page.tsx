'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/components/auth/AuthProvider';
import { useToast } from '@/hooks/useToast';
import { Button } from '@/components/ui/Button';
import { CardSkeleton } from '@/components/ui/Skeleton';
import {
  FileText,
  Trash2,
  Upload,
  Search,
  ArrowUpDown,
  BookOpen,
  ChevronRight,
} from 'lucide-react';

interface PdfListItem {
  id: string;
  title: string;
  filename: string;
  fileSize: number;
  createdAt: string;
}

function formatTitle(filename: string) {
  const withoutExt = filename.replace(/\.pdf$/i, '');
  return withoutExt
    .replace(/[_-]/g, ' ')
    .replace(/\s+/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .trim();
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function estimatePages(fileSize: number) {
  return Math.max(1, Math.round(fileSize / 25000));
}

function getGroup(dateStr: string): string {
  const now = Date.now();
  const date = new Date(dateStr).getTime();
  const diff = now - date;
  const days = Math.floor(diff / 86400000);
  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 7) return 'This Week';
  return 'Older';
}

const groupOrder = ['Today', 'Yesterday', 'This Week', 'Older'];

export default function LibraryPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const [pdfs, setPdfs] = useState<PdfListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<'date' | 'name'>('date');

  const fetchPdfs = useCallback(async () => {
    try {
      const res = await fetch('/api/pdfs');
      if (res.ok) setPdfs(await res.json());
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!authLoading && user) fetchPdfs();
    else if (!authLoading && !user) setLoading(false);
  }, [authLoading, user, fetchPdfs]);

  const handleDelete = useCallback(
    async (id: string) => {
      try {
        const res = await fetch(`/api/pdfs/${id}`, { method: 'DELETE' });
        if (res.ok) {
          setPdfs((prev) => prev.filter((p) => p.id !== id));
          toast('PDF deleted', 'success');
        }
      } catch {
        toast('Failed to delete PDF', 'error');
      }
    },
    [toast]
  );

  const filtered = pdfs
    .filter(
      (pdf) =>
        pdf.title.toLowerCase().includes(search.toLowerCase()) ||
        formatTitle(pdf.filename).toLowerCase().includes(search.toLowerCase())
    )
    .sort((a, b) => {
      if (sort === 'name') return a.filename.localeCompare(b.filename);
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

  const grouped = groupOrder
    .map((group) => ({
      group,
      items: filtered.filter((pdf) => getGroup(pdf.createdAt) === group),
    }))
    .filter((g) => g.items.length > 0);

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8 md:px-10 md:py-10">
      <div className="mb-6 flex items-center justify-between gap-4">
        <div className="flex items-baseline gap-3">
          <h1 className="font-serif text-2xl font-semibold tracking-tight text-slate-800 sm:text-3xl">
            Library
          </h1>
          {!loading && (
            <span className="text-sm text-slate-400">
              {filtered.length} {filtered.length === 1 ? 'PDF' : 'PDFs'}
            </span>
          )}
        </div>
      </div>

      <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" strokeWidth={1.5} />
          <input
            type="text"
            placeholder="Search documents..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm text-slate-800 placeholder-slate-400 transition-colors focus:border-slate-300 focus:outline-none focus:ring-1 focus:ring-slate-300"
          />
        </div>
        <div className="flex items-center gap-2">
          <ArrowUpDown className="size-4 text-slate-400" strokeWidth={1.5} />
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as typeof sort)}
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600 transition-colors focus:border-slate-300 focus:outline-none focus:ring-1 focus:ring-slate-300"
          >
            <option value="date">Sort by Date</option>
            <option value="name">Sort by Name</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-200 py-20">
          {search ? (
            <>
              <Search className="mb-4 size-10 text-slate-300" strokeWidth={1.5} />
              <p className="text-sm font-medium text-slate-500">No results for &ldquo;{search}&rdquo;</p>
              <button
                onClick={() => setSearch('')}
                className="mt-2 text-sm text-slate-400 underline hover:text-slate-600"
              >
                Clear search
              </button>
            </>
          ) : (
            <>
              <FileText className="mb-4 size-10 text-slate-300" strokeWidth={1.5} />
              <p className="text-sm font-medium text-slate-500">No PDFs yet</p>
              <p className="mt-1 text-xs text-slate-400">Upload your first PDF to start reading</p>
              <Link href="/upload" className="mt-5">
                <Button>
                  <Upload className="size-4" strokeWidth={1.5} />
                  Upload PDF
                </Button>
              </Link>
            </>
          )}
        </div>
      ) : (
        <div className="space-y-10">
          {grouped.map(({ group, items }) => (
            <section key={group}>
              <div className="mb-4 flex items-center gap-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  {group}
                </span>
                <span className="h-px flex-1 bg-slate-100" />
                <span className="text-xs text-slate-300">{items.length}</span>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {items.map((pdf) => (
                  <div
                    key={pdf.id}
                    className="group relative rounded-xl border border-slate-200 bg-white transition-all hover:border-slate-300 hover:shadow-md"
                  >
                    <button
                      onClick={() => router.push(`/read/${pdf.id}`)}
                      className="flex w-full items-center gap-4 p-4 text-left"
                    >
                      <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-slate-100">
                        <FileText className="size-4 text-slate-500" strokeWidth={1.5} />
                      </div>

                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-slate-800">
                          {formatTitle(pdf.title || pdf.filename)}
                        </p>
                        <p className="mt-0.5 text-xs text-slate-400">
                          {estimatePages(pdf.fileSize)} pages &middot; {formatDate(pdf.createdAt)}
                        </p>
                      </div>

                      <ChevronRight className="size-4 shrink-0 text-slate-300 transition-colors group-hover:text-slate-400" strokeWidth={1.5} />
                    </button>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(pdf.id);
                      }}
                      className="absolute right-2 top-2 flex size-7 items-center justify-center rounded-md text-slate-300 transition-all hover:bg-red-50 hover:text-red-400 sm:opacity-0 sm:group-hover:opacity-100"
                      aria-label="Delete PDF"
                    >
                      <Trash2 className="size-3.5" strokeWidth={1.5} />
                    </button>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
