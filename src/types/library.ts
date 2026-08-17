export interface PdfListItem {
  id: string;
  title: string;
  filename: string;
  fileSize: number;
  folderId: string | null;
  createdAt: string;
}

export interface FolderItem {
  id: string;
  name: string;
  userId: string;
  createdAt: string;
}

export interface ConfirmDeleteState {
  type: 'pdf' | 'folder' | 'bulk';
  ids: string[];
}

export type SortKey = 'date' | 'name';
