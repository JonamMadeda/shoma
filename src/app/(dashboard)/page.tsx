'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
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
  Folder,
  FolderPlus,
  Plus,
  Move,
  X,
} from 'lucide-react';

interface PdfListItem {
  id: string;
  title: string;
  filename: string;
  fileSize: number;
  folderId: string | null;
  createdAt: string;
}

interface FolderItem {
  id: string;
  name: string;
  userId: string;
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

export default function LibraryPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [pdfs, setPdfs] = useState<PdfListItem[]>([]);
  const [folders, setFolders] = useState<FolderItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<'date' | 'name'>('date');
  const [creatingFolder, setCreatingFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [moveTarget, setMoveTarget] = useState<string | null>(null);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());

  const fetchAll = useCallback(async () => {
    try {
      const [pdfsRes, foldersRes] = await Promise.all([
        fetch('/api/pdfs'),
        fetch('/api/folders'),
      ]);
      if (pdfsRes.ok) setPdfs(await pdfsRes.json());
      if (foldersRes.ok) {
        const f = await foldersRes.json();
        setFolders(f);
        setExpandedFolders(new Set(f.map((fo: FolderItem) => fo.id)));
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const handleCreateFolder = useCallback(async () => {
    const name = newFolderName.trim();
    if (!name) return;
    try {
      const res = await fetch('/api/folders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      });
      if (res.ok) {
        const folder = await res.json();
        setFolders((prev) => [folder, ...prev]);
        setExpandedFolders((prev) => new Set(prev).add(folder.id));
        setNewFolderName('');
        setCreatingFolder(false);
        toast('Folder created', 'success');
      }
    } catch {
      toast('Failed to create folder', 'error');
    }
  }, [newFolderName, toast]);

  const handleDeleteFolder = useCallback(async (id: string) => {
    try {
      const res = await fetch(`/api/folders/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setFolders((prev) => prev.filter((f) => f.id !== id));
        setPdfs((prev) => prev.map((p) => p.folderId === id ? { ...p, folderId: null } : p));
        toast('Folder deleted', 'success');
      }
    } catch {
      toast('Failed to delete folder', 'error');
    }
  }, [toast]);

  const handleDelete = useCallback(async (id: string) => {
    try {
      const res = await fetch(`/api/pdfs/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setPdfs((prev) => prev.filter((p) => p.id !== id));
        toast('PDF deleted', 'success');
      }
    } catch {
      toast('Failed to delete PDF', 'error');
    }
  }, [toast]);

  const handleMove = useCallback(async (pdfId: string, folderId: string | null) => {
    try {
      const res = await fetch(`/api/pdfs/${pdfId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ folderId }),
      });
      if (res.ok) {
        setPdfs((prev) => prev.map((p) => p.id === pdfId ? { ...p, folderId } : p));
        setMoveTarget(null);
        toast(folderId ? 'PDF moved' : 'PDF removed from folder', 'success');
      }
    } catch {
      toast('Failed to move PDF', 'error');
    }
  }, [toast]);

  const toggleFolder = (id: string) => {
    setExpandedFolders((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const filterSort = (list: PdfListItem[]) =>
    list
      .filter(
        (p) =>
          p.title.toLowerCase().includes(search.toLowerCase()) ||
          formatTitle(p.filename).toLowerCase().includes(search.toLowerCase())
      )
      .sort((a, b) => {
        if (sort === 'name') return a.filename.localeCompare(b.filename);
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });

  const uncategorized = filterSort(pdfs.filter((p) => !p.folderId));

  const renderPdfCard = (pdf: PdfListItem, inFolder = false) => (
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

      {moveTarget === pdf.id ? (
        <div className="border-t border-slate-100 px-4 py-2">
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              onClick={(e) => { e.stopPropagation(); handleMove(pdf.id, null); }}
              className="rounded-md px-2 py-1 text-xs text-slate-500 hover:bg-slate-100"
            >
              No folder
            </button>
            {folders
              .filter((f) => f.id !== pdf.folderId)
              .map((f) => (
                <button
                  key={f.id}
                  onClick={(e) => { e.stopPropagation(); handleMove(pdf.id, f.id); }}
                  className="rounded-md px-2 py-1 text-xs text-slate-500 hover:bg-slate-100"
                >
                  {f.name}
                </button>
              ))}
            <button
              onClick={(e) => { e.stopPropagation(); setMoveTarget(null); }}
              className="rounded-md px-2 py-1 text-xs text-red-400 hover:bg-red-50"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div className="absolute right-2 top-2 flex gap-0.5 opacity-0 transition-all group-hover:opacity-100 sm:opacity-0 sm:group-hover:opacity-100">
          {folders.length > 0 && (
            <button
              onClick={(e) => { e.stopPropagation(); setMoveTarget(moveTarget === pdf.id ? null : pdf.id); }}
              className="flex size-7 items-center justify-center rounded-md text-slate-300 hover:bg-slate-100 hover:text-slate-500"
              aria-label="Move PDF"
            >
              <Move className="size-3.5" strokeWidth={1.5} />
            </button>
          )}
          <button
            onClick={(e) => { e.stopPropagation(); handleDelete(pdf.id); }}
            className="flex size-7 items-center justify-center rounded-md text-slate-300 hover:bg-red-50 hover:text-red-400"
            aria-label="Delete PDF"
          >
            <Trash2 className="size-3.5" strokeWidth={1.5} />
          </button>
        </div>
      )}
    </div>
  );

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8 md:px-10 md:py-10">
      <div className="mb-6 flex items-center justify-between gap-4">
        <div className="flex items-baseline gap-3">
          <h1 className="font-serif text-2xl font-semibold tracking-tight text-slate-800 sm:text-3xl">
            Library
          </h1>
          {!loading && (
            <span className="text-sm text-slate-400">
              {pdfs.length} {pdfs.length === 1 ? 'PDF' : 'PDFs'}
            </span>
          )}
        </div>
        <button
          onClick={() => setCreatingFolder(!creatingFolder)}
          className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-500 transition-colors hover:bg-slate-50 hover:text-slate-700"
        >
          {creatingFolder ? <X className="size-4" strokeWidth={1.5} /> : <FolderPlus className="size-4" strokeWidth={1.5} />}
          <span className="hidden sm:inline">{creatingFolder ? 'Cancel' : 'Folder'}</span>
        </button>
      </div>

      {creatingFolder && (
        <div className="mb-6 flex items-center gap-2">
          <input
            type="text"
            value={newFolderName}
            onChange={(e) => setNewFolderName(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') handleCreateFolder(); if (e.key === 'Escape') { setCreatingFolder(false); setNewFolderName(''); } }}
            placeholder="Folder name..."
            className="flex-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 placeholder-slate-400 transition-colors focus:border-slate-300 focus:outline-none focus:ring-1 focus:ring-slate-300 max-w-xs"
            autoFocus
          />
          <Button size="sm" onClick={handleCreateFolder}>
            <Plus className="size-4" strokeWidth={1.5} />
            Create
          </Button>
        </div>
      )}

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
      ) : pdfs.length === 0 && folders.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-200 py-20">
          <FileText className="mb-4 size-10 text-slate-300" strokeWidth={1.5} />
          <p className="text-sm font-medium text-slate-500">No PDFs yet</p>
          <p className="mt-1 text-xs text-slate-400">Upload your first PDF to start reading</p>
          <Link href="/upload" className="mt-5">
            <Button>
              <Upload className="size-4" strokeWidth={1.5} />
              Upload PDF
            </Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-10">
          {folders.map((folder) => {
            const folderPdfs = filterSort(pdfs.filter((p) => p.folderId === folder.id));
            return (
              <section key={folder.id}>
                <div className="mb-3 flex items-center gap-2">
                  <button
                    onClick={() => toggleFolder(folder.id)}
                    className="flex items-center gap-2 text-left"
                  >
                    <Folder className="size-4 text-slate-500" strokeWidth={1.5} />
                    <span className="text-sm font-medium text-slate-700">{folder.name}</span>
                  </button>
                  <span className="text-xs text-slate-300">{folderPdfs.length}</span>
                  <button
                    onClick={() => handleDeleteFolder(folder.id)}
                    className="ml-auto flex size-6 items-center justify-center rounded text-slate-300 hover:bg-red-50 hover:text-red-400"
                    aria-label="Delete folder"
                  >
                    <Trash2 className="size-3" strokeWidth={1.5} />
                  </button>
                </div>
                {expandedFolders.has(folder.id) && (
                  folderPdfs.length > 0 ? (
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                      {folderPdfs.map((pdf) => renderPdfCard(pdf, true))}
                    </div>
                  ) : (
                    !search && (
                      <div className="rounded-lg border border-dashed border-slate-200 px-4 py-6 text-center">
                        <p className="text-xs text-slate-400">Empty folder</p>
                      </div>
                    )
                  )
                )}
              </section>
            );
          })}

          {uncategorized.length > 0 && (
            <section>
              <div className="mb-4 flex items-center gap-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  All PDFs
                </span>
                <span className="h-px flex-1 bg-slate-100" />
                <span className="text-xs text-slate-300">{uncategorized.length}</span>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {uncategorized.map((pdf) => renderPdfCard(pdf))}
              </div>
            </section>
          )}

          {uncategorized.length === 0 && folders.length > 0 && !search && (
            <section>
              <div className="mb-4 flex items-center gap-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  All PDFs
                </span>
                <span className="h-px flex-1 bg-slate-100" />
                <span className="text-xs text-slate-300">0</span>
              </div>
              <div className="rounded-lg border border-dashed border-slate-200 px-4 py-8 text-center">
                <p className="text-xs text-slate-400">All PDFs are in folders</p>
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
