// src/frontend/components/notes/NotesSidebar.tsx
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  FaFolder,
  FaFolderOpen,
  FaPlus,
  FaStar,
  FaThumbtack,
  FaTrash,
  FaSearch,
  FaTimes,
  FaChevronRight,
  FaChevronDown,
  FaEllipsisV,
  FaEdit,
  FaTrashAlt,
  FaFileAlt,
  FaHashtag,
  FaLayerGroup,
  FaStickyNote
} from 'react-icons/fa';
import type { NoteFolder, NoteItem } from '../../types/notes';
import type { FilterCategory } from '../../hooks/useNotes';
import { useLanguage } from '../../context/LanguageContext';

interface NotesSidebarProps {
  folders: NoteFolder[];
  notes: NoteItem[];
  activeFolderId: string | null;
  filterCategory: FilterCategory;
  selectedTag: string | null;
  searchQuery: string;
  allTags: Array<{ name: string; count: number }>;
  onSelectCategory: (category: FilterCategory, folderId?: string | null) => void;
  onSelectTag: (tag: string | null) => void;
  onSearchChange: (query: string) => void;
  onCreateNote: (folderId?: string | null) => void;
  onOpenFolderModal: (folderToEdit?: NoteFolder | null) => void;
  onDeleteFolder: (folderId: string) => void;
  onMoveToFolder?: (noteId: string, folderId: string | null) => void;
  onDeleteNote?: (noteId: string, permanent?: boolean) => void;
  activeNoteId?: string | null;
  onSelectNote?: (noteId: string) => void;
  isMobileDrawer?: boolean;
  onCloseMobileDrawer?: () => void;
}

export default function NotesSidebar({
  folders,
  notes,
  activeFolderId,
  filterCategory,
  selectedTag,
  searchQuery,
  allTags,
  onSelectCategory,
  onSelectTag,
  onSearchChange,
  onCreateNote,
  onOpenFolderModal,
  onDeleteFolder,
  onMoveToFolder,
  onDeleteNote,
  activeNoteId,
  onSelectNote,
  isMobileDrawer = false,
  onCloseMobileDrawer,
}: NotesSidebarProps) {
  const { t } = useLanguage();
  const [collapsedFolders, setCollapsedFolders] = useState<Record<string, boolean>>(() => {
    try {
      const saved = localStorage.getItem('emulist_collapsed_folders');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });
  const [openFolderMenuId, setOpenFolderMenuId] = useState<string | null>(null);
  const [dragOverTargetId, setDragOverTargetId] = useState<string | null>(null);

  const toggleFolderCollapse = (folderId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setCollapsedFolders((prev) => {
      const current = prev[folderId] !== false; // defaults to true (collapsed)
      const updated = {
        ...prev,
        [folderId]: !current,
      };
      localStorage.setItem('emulist_collapsed_folders', JSON.stringify(updated));
      return updated;
    });
  };

  const handleCategoryClick = (category: FilterCategory, folderId?: string | null) => {
    onSelectCategory(category, folderId);
    if (isMobileDrawer && onCloseMobileDrawer) {
      onCloseMobileDrawer();
    }
  };

  // Total counts
  const totalNotesCount = notes.filter((n) => !n.isTrash).length;
  const pinnedCount = notes.filter((n) => !n.isTrash && n.isPinned).length;
  const favoriteCount = notes.filter((n) => !n.isTrash && n.isFavorite).length;
  const trashCount = notes.filter((n) => n.isTrash).length;

  // Render folder tree item
  const renderFolderItem = (folder: NoteFolder, depth: number = 0) => {
    const isCollapsed = collapsedFolders[folder.id] !== false;
    const isFolderActive = filterCategory === 'folder' && activeFolderId === folder.id;
    const isDragOver = dragOverTargetId === folder.id;
    const folderNotesCount = notes.filter(
      (n) => !n.isTrash && n.folderId === folder.id
    ).length;

    const childFolders = folders.filter((f) => f.parentId === folder.id);
    const folderNotes = notes.filter((n) => !n.isTrash && n.folderId === folder.id);
    const hasChildren = childFolders.length > 0 || folderNotes.length > 0;

    return (
      <div key={folder.id} className="space-y-0.5">
        <div
          onClick={() => handleCategoryClick('folder', folder.id)}
          onDragOver={(e) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'move';
            if (dragOverTargetId !== folder.id) {
              setDragOverTargetId(folder.id);
            }
          }}
          onDragLeave={(e) => {
            if (!e.currentTarget.contains(e.relatedTarget as Node)) {
              if (dragOverTargetId === folder.id) {
                setDragOverTargetId(null);
              }
            }
          }}
          onDrop={(e) => {
            e.preventDefault();
            const noteId = e.dataTransfer.getData('text/plain') || e.dataTransfer.getData('noteId');
            if (noteId && onMoveToFolder) {
              onMoveToFolder(noteId, folder.id);
            }
            setDragOverTargetId(null);
          }}
          className={`group flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold cursor-pointer transition-all ${
            isDragOver
              ? 'ring-2 ring-amber-500 bg-amber-200 dark:bg-amber-950/80 scale-[1.02] shadow-md font-bold'
              : isFolderActive
              ? 'bg-amber-400 text-stone-950 shadow-sm font-bold'
              : 'text-stone-700 dark:text-zinc-300 hover:bg-stone-100 dark:hover:bg-zinc-800'
          }`}
          style={{ paddingLeft: `${12 + depth * 14}px` }}
        >
          <div className="flex items-center gap-2 min-w-0 flex-1">
            {hasChildren ? (
              <button
                type="button"
                onClick={(e) => toggleFolderCollapse(folder.id, e)}
                className="p-0.5 rounded hover:bg-black/10 text-stone-400 dark:text-zinc-500 hover:text-stone-700 dark:hover:text-zinc-200 transition-colors"
              >
                {isCollapsed ? (
                  <FaChevronRight className="text-[10px]" />
                ) : (
                  <FaChevronDown className="text-[10px]" />
                )}
              </button>
            ) : (
              <span className="w-3" />
            )}

            <div
              className="w-2.5 h-2.5 rounded-full shrink-0"
              style={{ backgroundColor: folder.color || '#f59e0b' }}
            />

            {isFolderActive || !isCollapsed ? (
              <FaFolderOpen className="text-sm opacity-80 shrink-0" />
            ) : (
              <FaFolder className="text-sm opacity-80 shrink-0" />
            )}

            <span className="truncate flex-1">{folder.name}</span>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <span
              className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                isDragOver
                  ? 'bg-amber-500 text-white font-bold'
                  : isFolderActive
                  ? 'bg-stone-950/20 text-stone-950 font-bold'
                  : 'bg-stone-200/60 dark:bg-zinc-800 text-stone-500 dark:text-zinc-400'
              }`}
            >
              {folderNotesCount}
            </span>

            {/* Folder Actions Menu */}
            <div className="relative">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setOpenFolderMenuId(openFolderMenuId === folder.id ? null : folder.id);
                }}
                className={`p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-black/10 transition-all ${
                  openFolderMenuId === folder.id ? 'opacity-100' : ''
                }`}
              >
                <FaEllipsisV className="text-[10px]" />
              </button>

              {openFolderMenuId === folder.id && (
                <div
                  className="absolute right-0 top-full mt-1 w-40 bg-white dark:bg-zinc-900 rounded-xl shadow-xl border border-stone-200 dark:border-zinc-800 py-1 z-30 text-xs"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    onClick={() => {
                      setOpenFolderMenuId(null);
                      onCreateNote(folder.id);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-stone-700 dark:text-zinc-300 hover:bg-stone-100 dark:hover:bg-zinc-800 text-left font-medium"
                  >
                    <FaPlus className="text-[10px] text-amber-500" />
                    <span>{t('notes.addNote')}</span>
                  </button>
                  <button
                    onClick={() => {
                      setOpenFolderMenuId(null);
                      onOpenFolderModal(folder);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-stone-700 dark:text-zinc-300 hover:bg-stone-100 dark:hover:bg-zinc-800 text-left font-medium"
                  >
                    <FaEdit className="text-[10px]" />
                    <span>{t('notes.edit')}</span>
                  </button>
                  <button
                    onClick={() => {
                      setOpenFolderMenuId(null);
                      if (confirm(t('notes.confirmDeleteFolder').replace('{name}', folder.name))) {
                        onDeleteFolder(folder.id);
                      }
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 text-left font-medium"
                  >
                    <FaTrashAlt className="text-[10px]" />
                    <span>{t('notes.delete')}</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Nested Child Folders & Notes */}
        {!isCollapsed && hasChildren && (
          <div className="space-y-0.5">
            {childFolders.map((cf) => renderFolderItem(cf, depth + 1))}
            {folderNotes.map((note) => (
              <div
                key={note.id}
                draggable={true}
                onDragStart={(e) => {
                  e.dataTransfer.setData('text/plain', note.id);
                  e.dataTransfer.setData('noteId', note.id);
                  e.dataTransfer.effectAllowed = 'move';
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectNote && onSelectNote(note.id);
                }}
                className={`group flex items-center gap-2 px-3 py-1.5 rounded-xl text-[11px] cursor-grab active:cursor-grabbing transition-all ${
                  activeNoteId === note.id
                    ? 'bg-amber-100/70 dark:bg-amber-900/30 text-amber-900 dark:text-amber-100 font-bold'
                    : 'text-stone-600 dark:text-zinc-400 hover:bg-stone-100 dark:hover:bg-zinc-800'
                }`}
                style={{ paddingLeft: `${12 + (depth + 1) * 14 + 18}px` }}
              >
                <FaFileAlt className="opacity-70 shrink-0 text-stone-400 dark:text-zinc-500" />
                <span className="truncate flex-1">{note.title || t('notes.untitledNote')}</span>
                
                {onDeleteNote && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (confirm(t('notes.confirmMoveToTrash').replace('{name}', note.title || t('notes.untitledNote')))) {
                        onDeleteNote(note.id, false);
                      }
                    }}
                    className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-500/10 text-stone-400 hover:text-red-500 rounded transition-all shrink-0"
                    title={t('notes.moveToTrash')}
                  >
                    <FaTrash className="text-[10px]" />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  const rootFolders = folders.filter((f) => !f.parentId);
  const rootNotes = notes.filter((n) => !n.isTrash && (!n.folderId || n.folderId === ''));

  return (
    <div className="h-full flex flex-col bg-white/70 dark:bg-zinc-950/70 backdrop-blur-xl border-r border-stone-200/80 dark:border-zinc-800/80 select-none">
      {/* Top Header & Search */}
      <div className="p-4 border-b border-stone-200/70 dark:border-zinc-800/70 space-y-3 shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-400/20 text-amber-600 dark:text-amber-400 flex items-center justify-center font-black shadow-inner">
              <FaStickyNote className="text-sm" />
            </div>
            <div>
              <h2 className="text-sm font-black tracking-tight text-stone-900 dark:text-white">
                {t('notes.myNotes')}
              </h2>
              <p className="text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
                Emu Note
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => onOpenFolderModal(null)}
              className="p-2 rounded-xl bg-stone-100 dark:bg-zinc-800 text-stone-600 dark:text-zinc-300 hover:bg-stone-200 dark:hover:bg-zinc-700 transition-all text-xs"
              title={t('notes.createNewFolder')}
            >
              <FaFolder className="text-amber-500" />
            </button>
            <button
              onClick={() => onCreateNote(activeFolderId)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-500 text-stone-950 font-bold transition-all text-xs shadow-sm shadow-amber-500/20"
              title={t('notes.createNewNote')}
            >
              <FaPlus className="text-[10px]" />
              <span>{t('notes.newNote')}</span>
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 dark:text-zinc-500 text-xs" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={t('notes.searchPlaceholder')}
            className="w-full pl-8 pr-8 py-2 rounded-xl bg-stone-100/80 dark:bg-zinc-900 border border-stone-200/50 dark:border-zinc-800 text-xs text-stone-900 dark:text-white placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-400 transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 dark:hover:text-zinc-200 text-xs"
            >
              <FaTimes />
            </button>
          )}
        </div>
      </div>

      {/* Main Scrollable Navigation Area */}
      <div className="flex-1 overflow-y-auto p-3 space-y-5 custom-scrollbar">
        {/* Quick Nav Categories */}
        <div className="space-y-1">
          <button
            onClick={() => handleCategoryClick('all', null)}
            onDragOver={(e) => {
              e.preventDefault();
              e.dataTransfer.dropEffect = 'move';
              if (dragOverTargetId !== 'root') {
                setDragOverTargetId('root');
              }
            }}
            onDragLeave={(e) => {
              if (!e.currentTarget.contains(e.relatedTarget as Node)) {
                if (dragOverTargetId === 'root') {
                  setDragOverTargetId(null);
                }
              }
            }}
            onDrop={(e) => {
              e.preventDefault();
              const noteId = e.dataTransfer.getData('text/plain') || e.dataTransfer.getData('noteId');
              if (noteId && onMoveToFolder) {
                onMoveToFolder(noteId, null);
              }
              setDragOverTargetId(null);
            }}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
              dragOverTargetId === 'root'
                ? 'ring-2 ring-amber-500 bg-amber-200 dark:bg-amber-950/80 scale-[1.02] shadow-md font-bold'
                : filterCategory === 'all' && !selectedTag
                ? 'bg-amber-400 text-stone-950 font-bold shadow-sm'
                : 'text-stone-700 dark:text-zinc-300 hover:bg-stone-100 dark:hover:bg-zinc-800'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <FaLayerGroup className="text-sm opacity-80" />
              <span>{t('notes.allNotesRoot')}</span>
            </div>
            <span
              className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                dragOverTargetId === 'root'
                  ? 'bg-amber-500 text-white font-bold'
                  : filterCategory === 'all' && !selectedTag
                  ? 'bg-stone-950/20 text-stone-950 font-bold'
                  : 'bg-stone-200/60 dark:bg-zinc-800 text-stone-500 dark:text-zinc-400'
              }`}
            >
              {totalNotesCount}
            </span>
          </button>

          <button
            onClick={() => handleCategoryClick('pinned', null)}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
              filterCategory === 'pinned'
                ? 'bg-amber-400 text-stone-950 font-bold shadow-sm'
                : 'text-stone-700 dark:text-zinc-300 hover:bg-stone-100 dark:hover:bg-zinc-800'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <FaThumbtack className="text-sm text-amber-500 opacity-90" />
              <span>{t('notes.pinnedItems')}</span>
            </div>
            <span
              className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                filterCategory === 'pinned'
                  ? 'bg-stone-950/20 text-stone-950 font-bold'
                  : 'bg-stone-200/60 dark:bg-zinc-800 text-stone-500 dark:text-zinc-400'
              }`}
            >
              {pinnedCount}
            </span>
          </button>

          <button
            onClick={() => handleCategoryClick('favorites', null)}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
              filterCategory === 'favorites'
                ? 'bg-amber-400 text-stone-950 font-bold shadow-sm'
                : 'text-stone-700 dark:text-zinc-300 hover:bg-stone-100 dark:hover:bg-zinc-800'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <FaStar className="text-sm text-amber-400 opacity-90" />
              <span>{t('notes.favorites')}</span>
            </div>
            <span
              className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                filterCategory === 'favorites'
                  ? 'bg-stone-950/20 text-stone-950 font-bold'
                  : 'bg-stone-200/60 dark:bg-zinc-800 text-stone-500 dark:text-zinc-400'
              }`}
            >
              {favoriteCount}
            </span>
          </button>

          <button
            onClick={() => handleCategoryClick('trash', null)}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
              filterCategory === 'trash'
                ? 'bg-red-500 text-white font-bold shadow-sm'
                : 'text-stone-700 dark:text-zinc-300 hover:bg-stone-100 dark:hover:bg-zinc-800'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <FaTrash className="text-sm text-red-400 opacity-90" />
              <span>{t('notes.trash')}</span>
            </div>
            <span
              className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                filterCategory === 'trash'
                  ? 'bg-white/20 text-white font-bold'
                  : 'bg-stone-200/60 dark:bg-zinc-800 text-stone-500 dark:text-zinc-400'
              }`}
            >
              {trashCount}
            </span>
          </button>
        </div>

        {/* Folders Hierarchy */}
        <div>
          <div className="flex items-center justify-between px-3 mb-2 text-[10px] font-bold tracking-widest uppercase text-stone-400 dark:text-zinc-500">
            <span>{t('notes.foldersList')}</span>
            <button
              onClick={() => onOpenFolderModal(null)}
              className="hover:text-amber-500 transition-colors"
              title={t('notes.newFolder')}
            >
              <FaPlus />
            </button>
          </div>

          {rootFolders.length === 0 && rootNotes.length === 0 ? (
            <div className="px-3 py-3 rounded-xl bg-stone-50 dark:bg-zinc-900/40 text-center border border-dashed border-stone-200 dark:border-zinc-800">
              <p className="text-xs text-stone-400 dark:text-zinc-500">
                {t('notes.noFoldersYet')}
              </p>
              <button
                onClick={() => onOpenFolderModal(null)}
                className="mt-1 text-xs text-amber-600 dark:text-amber-400 font-bold hover:underline"
              >
                {t('notes.createFolderBtn')}
              </button>
            </div>
          ) : (
            <div className="space-y-0.5">
              {rootFolders.map((f) => renderFolderItem(f, 0))}
              {rootNotes.map((note) => (
                <div
                  key={note.id}
                  draggable={true}
                  onDragStart={(e) => {
                    e.dataTransfer.setData('text/plain', note.id);
                    e.dataTransfer.setData('noteId', note.id);
                    e.dataTransfer.effectAllowed = 'move';
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectNote && onSelectNote(note.id);
                  }}
                  className={`group flex items-center gap-2 px-3 py-1.5 rounded-xl text-[11px] cursor-grab active:cursor-grabbing transition-all ${
                    activeNoteId === note.id
                      ? 'bg-amber-100/70 dark:bg-amber-900/30 text-amber-900 dark:text-amber-100 font-bold'
                      : 'text-stone-600 dark:text-zinc-400 hover:bg-stone-100 dark:hover:bg-zinc-800'
                  }`}
                  style={{ paddingLeft: `12px` }}
                >
                  <FaFileAlt className="opacity-70 shrink-0 text-stone-400 dark:text-zinc-500" />
                  <span className="truncate flex-1">{note.title || t('notes.untitledNote')}</span>
                  
                  {onDeleteNote && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm(t('notes.confirmMoveToTrash').replace('{name}', note.title || t('notes.untitledNote')))) {
                          onDeleteNote(note.id, false);
                        }
                      }}
                      className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-500/10 text-stone-400 hover:text-red-500 rounded transition-all shrink-0"
                      title={t('notes.moveToTrash')}
                    >
                      <FaTrash className="text-[10px]" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Tags Cloud */}
        {allTags.length > 0 && (
          <div>
            <div className="flex items-center justify-between px-3 mb-2 text-[10px] font-bold tracking-widest uppercase text-stone-400 dark:text-zinc-500">
              <span>{t('notes.tags')}</span>
              {selectedTag && (
                <button
                  onClick={() => onSelectTag(null)}
                  className="text-amber-600 dark:text-amber-400 hover:underline capitalize text-[10px]"
                >
                  {t('notes.clear')}
                </button>
              )}
            </div>
            <div className="flex flex-wrap gap-1.5 px-2">
              {allTags.map((tag) => {
                const isSelected = selectedTag === tag.name;
                return (
                  <button
                    key={tag.name}
                    onClick={() => {
                      if (isSelected) {
                        onSelectTag(null);
                      } else {
                        onSelectTag(tag.name);
                        onSelectCategory('tag', null);
                      }
                    }}
                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs transition-all ${
                      isSelected
                        ? 'bg-amber-400 text-stone-950 font-bold shadow-sm'
                        : 'bg-stone-100 dark:bg-zinc-800 text-stone-700 dark:text-zinc-300 hover:bg-stone-200 dark:hover:bg-zinc-700'
                    }`}
                  >
                    <FaHashtag className="text-[10px] opacity-70" />
                    <span>{tag.name}</span>
                    <span className="text-[10px] opacity-60 ml-0.5">({tag.count})</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Footer Stats Info */}
      <div className="p-3 border-t border-stone-200/70 dark:border-zinc-800/70 bg-stone-50/50 dark:bg-zinc-900/30 text-[11px] text-stone-400 dark:text-zinc-500 flex items-center justify-between shrink-0">
        <span className="flex items-center gap-1">
          <FaFileAlt className="text-[10px]" />
          {totalNotesCount} {t('notes.noteCount')}
        </span>
        <span className="flex items-center gap-1">
          <FaFolder className="text-[10px]" />
          {folders.length} {t('notes.folderCount')}
        </span>
      </div>
    </div>
  );
}
