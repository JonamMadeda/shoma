import type { PdfListItem, SortKey } from '@/types/library';

export function formatTitle(filename: string) {
  const withoutExt = filename.replace(/\.pdf$/i, '');
  return withoutExt
    .replace(/[_-]/g, ' ')
    .replace(/\s+/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .trim();
}

export function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function estimatePages(fileSize: number) {
  return Math.max(1, Math.round(fileSize / 25000));
}

export function filterSortPdfs(list: PdfListItem[], search: string, sort: SortKey) {
  return list
    .filter(
      (p) =>
        p.title.toLowerCase().includes(search.toLowerCase()) ||
        formatTitle(p.filename).toLowerCase().includes(search.toLowerCase())
    )
    .sort((a, b) => {
      if (sort === 'name') return a.filename.localeCompare(b.filename);
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
}
