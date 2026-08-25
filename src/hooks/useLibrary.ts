'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useToast } from '@/hooks/useToast';
import type { PdfListItem, FolderItem } from '@/types/library';

export function useLibrary() {
  const { toast } = useToast();
  const [pdfs, setPdfs] = useState<PdfListItem[]>([]);
  const [folders, setFolders] = useState<FolderItem[]>([]);
  const [loading, setLoading] = useState(true);
  const mountedRef = useRef(true);

  const refresh = useCallback(async () => {
    try {
      const [pdfsRes, foldersRes] = await Promise.all([
        fetch('/api/pdfs'),
        fetch('/api/folders'),
      ]);
      if (!mountedRef.current) return;
      if (pdfsRes.ok) setPdfs(await pdfsRes.json());
      if (foldersRes.ok) {
        setFolders(await foldersRes.json());
      } else {
        toast('Failed to load folders', 'error');
      }
    } catch {
      if (mountedRef.current) {
        toast('Failed to load library', 'error');
      }
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    mountedRef.current = true;
    setTimeout(() => { refresh(); }, 0);
    return () => { mountedRef.current = false; };
  }, [refresh]);

  const createFolder = useCallback(async (name: string) => {
    try {
      const res = await fetch('/api/folders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      });
      if (res.ok) {
        const folder: FolderItem = await res.json();
        setFolders((prev) => [folder, ...prev]);
        toast('Folder created', 'success');
        return folder;
      }
      toast('Failed to create folder', 'error');
    } catch {
      toast('Failed to create folder', 'error');
    }
    return null;
  }, [toast]);

  const deleteFolder = useCallback(async (id: string) => {
    try {
      const res = await fetch(`/api/folders/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setFolders((prev) => prev.filter((f) => f.id !== id));
        setPdfs((prev) => prev.map((p) => p.folderId === id ? { ...p, folderId: null } : p));
        toast('Folder deleted', 'success');
        return true;
      }
      toast('Failed to delete folder', 'error');
    } catch {
      toast('Failed to delete folder', 'error');
    }
    return false;
  }, [toast]);

  const deletePdf = useCallback(async (id: string) => {
    try {
      const res = await fetch(`/api/pdfs/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setPdfs((prev) => prev.filter((p) => p.id !== id));
        toast('PDF deleted', 'success');
        return true;
      }
      toast('Failed to delete PDF', 'error');
    } catch {
      toast('Failed to delete PDF', 'error');
    }
    return false;
  }, [toast]);

  const movePdf = useCallback(async (pdfId: string, folderId: string | null) => {
    try {
      const res = await fetch(`/api/pdfs/${pdfId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ folderId }),
      });
      if (res.ok) {
        setPdfs((prev) => prev.map((p) => p.id === pdfId ? { ...p, folderId } : p));
        toast(folderId ? 'PDF moved' : 'PDF removed from folder', 'success');
        return true;
      }
      toast('Failed to move PDF', 'error');
    } catch {
      toast('Failed to move PDF', 'error');
    }
    return false;
  }, [toast]);

  const bulkDelete = useCallback(async (ids: string[]) => {
    const results = await Promise.allSettled(
      ids.map((id) =>
        fetch(`/api/pdfs/${id}`, { method: 'DELETE' }).then((res) => {
          if (!res.ok) throw new Error('Failed');
          return id;
        })
      )
    );
    const success = results.filter((r) => r.status === 'fulfilled').length;
    const failed = results.length - success;
    if (success > 0) {
      setPdfs((prev) => prev.filter((p) => !ids.includes(p.id)));
      toast(`Deleted ${success} PDF${success > 1 ? 's' : ''}`, 'success');
    }
    if (failed > 0) {
      toast(`Failed to delete ${failed} PDF${failed > 1 ? 's' : ''}`, 'error');
    }
    return success;
  }, [toast]);

  const bulkMove = useCallback(async (ids: string[], folderId: string | null) => {
    const results = await Promise.allSettled(
      ids.map((pdfId) =>
        fetch(`/api/pdfs/${pdfId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ folderId }),
        }).then((res) => {
          if (!res.ok) throw new Error('Failed');
          return pdfId;
        })
      )
    );
    const success = results.filter((r) => r.status === 'fulfilled').length;
    const failed = results.length - success;
    if (success > 0) {
      setPdfs((prev) => prev.map((p) => ids.includes(p.id) ? { ...p, folderId } : p));
      toast(`Moved ${success} PDF${success > 1 ? 's' : ''}`, 'success');
    }
    if (failed > 0) {
      toast(`Failed to move ${failed} PDF${failed > 1 ? 's' : ''}`, 'error');
    }
    return success;
  }, [toast]);

  return {
    pdfs,
    folders,
    loading,
    refresh,
    createFolder,
    deleteFolder,
    deletePdf,
    movePdf,
    bulkDelete,
    bulkMove,
  };
}
