// src/frontend/types/notes.ts

export type NoteFontFamily = 'sans' | 'serif' | 'mono' | 'handwriting';
export type NoteFontSize = 'sm' | 'base' | 'lg' | 'xl';
export type NoteLineHeight = 'compact' | 'normal' | 'relaxed';
export type NoteTheme = 'default' | 'amber' | 'emerald' | 'cyan' | 'purple' | 'rose' | 'sepia' | 'slate';
export type NoteViewMode = 'edit' | 'split' | 'preview';

export interface NoteAttachment {
  id: string;
  name: string;
  url: string; // Base64 data URL or Firebase Storage URL
  type: 'screenshot' | 'image' | 'file';
  size?: number;
  createdAt: string;
}

export interface NoteFolder {
  id: string;
  name: string;
  color?: string;
  icon?: string;
  parentId?: string | null; // Supports nested folders
  userId: string;
  createdAt: string;
  updatedAt: string;
  order?: number;
  isExpanded?: boolean;
}

export interface NoteItem {
  id: string;
  userId: string;
  title: string;
  content: string;
  folderId?: string | null;
  tags: string[];
  isPinned?: boolean;
  isFavorite?: boolean;
  isArchived?: boolean;
  isTrash?: boolean;
  color?: string;
  coverImage?: string;
  attachments?: NoteAttachment[];
  fontFamily?: NoteFontFamily;
  fontSize?: NoteFontSize;
  lineHeight?: NoteLineHeight;
  theme?: NoteTheme;
  createdAt: string;
  updatedAt: string;
}

export interface NoteSettings {
  defaultFontFamily: NoteFontFamily;
  defaultFontSize: NoteFontSize;
  defaultLineHeight: NoteLineHeight;
  defaultTheme: NoteTheme;
  defaultViewMode: NoteViewMode;
  autoSave: boolean;
  spellCheck: boolean;
}
