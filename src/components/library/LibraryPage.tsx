'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useLibrary } from '@/hooks/useLibrary';
import { CardSkeleton } from '@/components/ui/Skeleton';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { FolderCreateModal } from '@/components/ui/FolderCreateModal';
import { filterSortPdfs } from '@/lib/library-utils';
import type { SortKey, ConfirmDeleteState } from '@/types/library';
import { LibraryHeader } from './LibraryHeader';
import { SearchBar } from './SearchBar';
import { FolderSection } from './FolderSection';
import { PdfCard } from './PdfCard';
import { MultiSelectActionBar } from './MultiSelectActionBar';
import { EmptyState } from './EmptyState';

export default function LibraryPage() {
  const router = useRouter();
  const {
    pdfs,
    folders,
    loading,
    createFolder,
    deleteFolder,
    deletePdf,
    movePdf,
    bulkDelete,
    bulkMove,
  } = useLibrary();

  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<SortKey>('date');
  const [creatingFolder, setCreatingFolder] = useState(false);
  const [moveTarget, setMoveTarget] = useState<string | null>(null);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const [selectMode, setSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [confirmDelete, setConfirmDelete] = useState<ConfirmDeleteState | null>(null);
  const [showAllUncategorized, setShowAllUncategorized] = useState(false);

  const toggleFolder = (id: string) => {
    setExpandedFolders((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const exitSelectMode = () => {
    setSelectMode(false);
    setSelectedIds(new Set());
  };

  const handleSearchChange = (value: string) => {
    setSearch(value);
    setShowAllUncategorized(false);
  };

  const handleCreateFolder = async (name: string) => {
    const folder = await createFolder(name);
    if (folder) {
      setExpandedFolders((prev) => new Set(prev).add(folder.id));
      setCreatingFolder(false);
    }
  };

  const handleBulkDelete = () => {
    setConfirmDelete({ type: 'bulk', ids: Array.from(selectedIds) });
  };

  const executeBulkDelete = async () => {
    if (!confirmDelete || confirmDelete.type !== 'bulk') return;
    await bulkDelete(confirmDelete.ids);
    exitSelectMode();
    setConfirmDelete(null);
  };

  const handleBulkMove = async (folderId: string | null) => {
    await bulkMove(Array.from(selectedIds), folderId);
    exitSelectMode();
  };

  const handleConfirmDeletePdf = () => {
    if (!confirmDelete || confirmDelete.type !== 'pdf') return;
    deletePdf(confirmDelete.ids[0]);
    setSelectedIds((prev) => { const next = new Set(prev); next.delete(confirmDelete.ids[0]); return next; });
    setConfirmDelete(null);
  };

  const handleConfirmDeleteFolder = () => {
    if (!confirmDelete || confirmDelete.type !== 'folder') return;
    deleteFolder(confirmDelete.ids[0]);
    setConfirmDelete(null);
  };

  const filteredPdfs = useMemo(
    () => filterSortPdfs(pdfs, search, sort),
    [pdfs, search, sort]
  );

  const pdfsByFolder = useMemo(() => {
    const map: Record<string, typeof filteredPdfs> = {};
    const uncategorized: typeof filteredPdfs = [];
    for (const pdf of filteredPdfs) {
      if (pdf.folderId) {
        if (!map[pdf.folderId]) map[pdf.folderId] = [];
        map[pdf.folderId].push(pdf);
      } else {
        uncategorized.push(pdf);
      }
    }
    return { byFolder: map, uncategorized };
  }, [filteredPdfs]);

  const displayedUncategorized = showAllUncategorized
    ? pdfsByFolder.uncategorized
    : pdfsByFolder.uncategorized.slice(0, 9);

  const confirmTitle = confirmDelete
    ? confirmDelete.type === 'pdf'
      ? 'Delete PDF'
      : confirmDelete.type === 'folder'
        ? 'Delete Folder'
        : `Delete ${confirmDelete.ids.length} PDF${confirmDelete.ids.length !== 1 ? 's' : ''}`
    : '';

  const confirmMessage = confirmDelete
    ? confirmDelete.type === 'pdf'
      ? 'Are you sure you want to delete this PDF? This action cannot be undone.'
      : confirmDelete.type === 'folder'
        ? 'Are you sure you want to delete this folder? PDFs inside it will be moved to the uncategorized section.'
        : `Are you sure you want to delete ${confirmDelete.ids.length} PDF${confirmDelete.ids.length !== 1 ? 's' : ''}? This action cannot be undone.`
    : '';

  const confirmLabel = confirmDelete?.type === 'bulk'
    ? `Delete ${confirmDelete.ids.length}`
    : 'Delete';

  const handleConfirm =
    confirmDelete?.type === 'pdf'
      ? handleConfirmDeletePdf
      : confirmDelete?.type === 'folder'
        ? handleConfirmDeleteFolder
        : confirmDelete?.type === 'bulk'
          ? executeBulkDelete
          : () => {};

  const hasFolders = folders.length > 0;
  const hasUncategorized = pdfsByFolder.uncategorized.length > 0;
  const hasSearchResults = filteredPdfs.length > 0;
  const folderPdfCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const pdf of pdfs) if (pdf.folderId) counts[pdf.folderId] = (counts[pdf.folderId] ?? 0) + 1;
    return counts;
  }, [pdfs]);

  return (
    <>
      <main className="mx-auto w-full max-w-6xl">
        <LibraryHeader
          pdfCount={pdfs.length}
          folderCount={folders.length}
          loading={loading}
          selectMode={selectMode}
          selectedCount={selectedIds.size}
          onToggleSelect={() => setSelectMode(true)}
          onToggleFolder={() => setCreatingFolder(true)}
          onExitSelectMode={exitSelectMode}
        />

        <SearchBar
          search={search}
          sort={sort}
          onSearchChange={handleSearchChange}
          onSortChange={setSort}
        />

        {loading ? (
          <div className="space-y-2 sm:space-y-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <CardSkeleton key={i} />
            ))}
          </div>
        ) : pdfs.length === 0 && folders.length === 0 ? (
          <EmptyState type="no-pdfs" />
        ) : search && !hasSearchResults ? (
          <EmptyState type="no-results" onClearSearch={() => setSearch('')} />
        ) : (
          <div className="space-y-8 sm:space-y-10">
            {hasFolders && (
              <section className="rounded-2xl border border-border bg-surface-muted/30 p-3 sm:p-4">
                <div className="mb-3 flex items-center gap-2 sm:mb-4">
                  <div className="h-4 w-1 rounded-full bg-accent" />
                  <h2 className="text-xs font-bold uppercase tracking-wider text-foreground sm:text-muted">
                    Folders
                  </h2>
                  <span className="text-xs tabular-nums text-muted-faint">
                    {folders.length}
                  </span>
                </div>
                <div className="space-y-3">
                  {folders.map((folder) => (
                    <FolderSection
                      key={folder.id}
                      folder={folder}
                      pdfs={pdfsByFolder.byFolder[folder.id] ?? []}
                      totalPdfCount={folderPdfCounts[folder.id] ?? 0}
                      expanded={expandedFolders.has(folder.id)}
                      selectMode={selectMode}
                      selectedIds={selectedIds}
                      moveTarget={moveTarget}
                      folders={folders}
                      search={search}
                      onToggle={toggleFolder}
                      onDelete={(id) => setConfirmDelete({ type: 'folder', ids: [id] })}
                      onToggleSelect={toggleSelect}
                      onOpenPdf={(id: string) => router.push(`/read/${id}`)}
                      onStartMove={setMoveTarget}
                      onMovePdf={movePdf}
                      onDeletePdf={(id: string) => setConfirmDelete({ type: 'pdf', ids: [id] })}
                    />
                  ))}
                </div>
              </section>
            )}

            {hasUncategorized && (
              <section className="rounded-2xl border border-border bg-surface-muted/30 p-3 sm:p-4">
                <div className="mb-3 flex items-center gap-2 sm:mb-4">
                  <div className="h-4 w-1 rounded-full bg-accent" />
                  <h2 className="text-xs font-bold uppercase tracking-wider text-foreground sm:text-muted">
                    All Documents
                  </h2>
                  <span className="text-xs tabular-nums text-muted-faint">
                    {pdfsByFolder.uncategorized.length}
                  </span>
                </div>
                <div
                  className="overflow-hidden rounded-xl border border-border bg-white sm:rounded-xl"
                  role={selectMode ? 'listbox' : undefined}
                  aria-label={selectMode ? 'Select PDFs' : undefined}
                >
                  <div className="divide-y divide-border-subtle px-3 sm:px-4">
                    {displayedUncategorized.map((pdf) => (
                      <PdfCard
                        key={pdf.id}
                        pdf={pdf}
                        selectMode={selectMode}
                        isSelected={selectedIds.has(pdf.id)}
                        moveTarget={moveTarget}
                        folders={folders}
                        onToggleSelect={toggleSelect}
                        onOpen={(id: string) => router.push(`/read/${id}`)}
                        onStartMove={setMoveTarget}
                        onMove={movePdf}
                        onDelete={(id: string) => setConfirmDelete({ type: 'pdf', ids: [id] })}
                      />
                    ))}
                  </div>
                </div>
                {pdfsByFolder.uncategorized.length > 9 && !showAllUncategorized && (
                  <button
                    onClick={() => setShowAllUncategorized(true)}
                    className="mt-3 w-full rounded-xl border border-border bg-white py-2.5 text-sm font-medium text-muted transition-all duration-150 hover:bg-surface-muted hover:text-foreground active:scale-[0.99]"
                  >
                    Show all {pdfsByFolder.uncategorized.length} documents &darr;
                  </button>
                )}
              </section>
            )}

            {pdfsByFolder.uncategorized.length === 0 && folders.length > 0 && !search && (
              <EmptyState type="all-in-folders" />
            )}
          </div>
        )}
      </main>

      {selectMode && selectedIds.size > 0 && (
        <MultiSelectActionBar
          selectedCount={selectedIds.size}
          folders={folders}
          onBulkMove={handleBulkMove}
          onBulkDelete={handleBulkDelete}
        />
      )}

      <ConfirmDialog
        open={confirmDelete !== null}
        title={confirmTitle}
        message={confirmMessage}
        confirmLabel={confirmLabel}
        variant="danger"
        onConfirm={handleConfirm}
        onCancel={() => setConfirmDelete(null)}
      />

      <FolderCreateModal
        open={creatingFolder}
        onCreate={handleCreateFolder}
        onCancel={() => setCreatingFolder(false)}
      />
    </>
  );
}
