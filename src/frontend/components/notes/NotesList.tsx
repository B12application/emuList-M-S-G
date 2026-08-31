// src/frontend/components/notes/NotesList.tsx
import React, { useState } from 'react';
import {
  FaPlus,
  FaThumbtack,
  FaStar,
  FaTrash,
  FaFolder,
  FaCalendarAlt,
  FaSortAmountDown,
  FaCamera,
  FaImage,
  FaHashtag,
  FaUndo,
  FaTrashAlt,
  FaEllipsisV,
  FaCheck,
  FaGripVertical
} from 'react-icons/fa';
import type { NoteItem, NoteFolder } from '../../types/notes';
import type { FilterCategory } from '../../hooks/useNotes';
import { formatDistanceToNow, format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { useLanguage } from '../../context/LanguageContext';

interface NotesListProps {
  notes: NoteItem[];
  folders: NoteFolder[];
  activeNoteId: string | null;
  activeFolderId: string | null;
  filterCategory: FilterCategory;
  selectedTag: string | null;
  searchQuery: string;
  onSelectNote: (noteId: string) => void;
  onCreateNote: () => void;
  onTogglePin: (noteId: string) => void;
  onToggleFavorite: (noteId: string) => void;
  onDeleteNote: (noteId: string, permanent?: boolean) => void;
  onRestoreNote: (noteId: string) => void;
  onMoveToFolder: (noteId: string, folderId: string | null) => void;
  onEmptyTrash?: () => void;
}

type SortOption = 'updated_desc' | 'created_desc' | 'title_asc' | 'title_desc';

export default function NotesList({
  notes,
  folders,
  activeNoteId,
  activeFolderId,
  filterCategory,
  selectedTag,
  searchQuery,
  onSelectNote,
  onCreateNote,
  onTogglePin,
  onToggleFavorite,
  onDeleteNote,
  onRestoreNote,
  onMoveToFolder,
  onEmptyTrash,
}: NotesListProps) {
  const { t } = useLanguage();
  const [sortBy, setSortBy] = useState<SortOption>('updated_desc');
  const [activeMenuNoteId, setActiveMenuNoteId] = useState<string | null>(null);

  // Folder lookup map
  const folderMap = new Map<string, NoteFolder>();
  folders.forEach((f) => folderMap.set(f.id, f));

  // Determine current active folder name
  const currentFolderName = activeFolderId
    ? folderMap.get(activeFolderId)?.name || t('notes.folder')
    : t('notes.notes');

  // Get current view title
  const getViewTitle = () => {
    if (searchQuery) return `${t('notes.searchPrefix')}: "${searchQuery}"`;
    if (selectedTag) return `#${selectedTag}`;
    if (filterCategory === 'pinned') return t('notes.pinnedNotes');
    if (filterCategory === 'favorites') return t('notes.favoriteNotes');
    if (filterCategory === 'trash') return t('notes.trash');
    if (filterCategory === 'folder') return currentFolderName;
    return t('notes.allNotes');
  };

  // Sort notes
  const sortedNotes = [...notes].sort((a, b) => {
    // Pinned notes always top (unless viewing trash)
    if (filterCategory !== 'trash') {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
    }

    if (sortBy === 'updated_desc') {
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    }
    if (sortBy === 'created_desc') {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    }
    if (sortBy === 'title_asc') {
      return (a.title || t('notes.untitled')).localeCompare(b.title || t('notes.untitled'));
    }
    if (sortBy === 'title_desc') {
      return (b.title || t('notes.untitled')).localeCompare(a.title || t('notes.untitled'));
    }
    return 0;
  });

  const formatDate = (isoString: string) => {
    try {
      const date = new Date(isoString);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      // If less than 24 hours ago, relative time
      if (diffMs < 24 * 60 * 60 * 1000) {
        return formatDistanceToNow(date, { addSuffix: true, locale: tr });
      }
      return format(date, 'd MMM yyyy', { locale: tr });
    } catch {
      return t('notes.unknownDate');
    }
  };

  return (
    <div className="h-full flex flex-col bg-stone-50/50 dark:bg-zinc-900/50 border-r border-stone-200/80 dark:border-zinc-800/80">
      {/* List Header */}
      <div className="p-4 border-b border-stone-200/70 dark:border-zinc-800/70 shrink-0 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-stone-900 dark:text-white truncate flex items-center gap-1.5">
            {filterCategory === 'folder' && <FaFolder className="text-amber-500 text-xs" />}
            {filterCategory === 'pinned' && <FaThumbtack className="text-amber-500 text-xs" />}
            {filterCategory === 'favorites' && <FaStar className="text-amber-400 text-xs" />}
            {filterCategory === 'trash' && <FaTrash className="text-red-400 text-xs" />}
            {selectedTag && <FaHashtag className="text-amber-500 text-xs" />}
            <span>{getViewTitle()}</span>
          </h3>
          <p className="text-[11px] text-stone-400 dark:text-zinc-500">
            {sortedNotes.length} {t('notes.notesListed')}
          </p>
        </div>

        {/* Sort Dropdown & Empty Trash */}
        <div className="flex items-center gap-2">
          {filterCategory === 'trash' && onEmptyTrash && sortedNotes.length > 0 && (
            <button
              onClick={() => {
                if (confirm(t('notes.confirmEmptyTrash'))) {
                  onEmptyTrash();
                }
              }}
              className="text-[10px] sm:text-[11px] font-bold bg-red-500/10 text-red-600 dark:text-red-400 hover:bg-red-500/20 px-2.5 py-1 rounded-lg transition-colors flex items-center gap-1.5 border border-red-500/20 shadow-sm"
              title={t('notes.emptyTrashTitle')}
            >
              <FaTrashAlt />
              {t('notes.emptyTrash')}
            </button>
          )}

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortOption)}
            className="text-[11px] font-medium bg-white dark:bg-zinc-800 border border-stone-200 dark:border-zinc-700 rounded-lg px-2 py-1 text-stone-600 dark:text-zinc-300 focus:outline-none focus:ring-1 focus:ring-amber-400"
          >
            <option value="updated_desc">{t('notes.sortByUpdatedDesc')}</option>
            <option value="created_desc">{t('notes.sortByCreatedDesc')}</option>
            <option value="title_asc">{t('notes.sortByTitleAsc')}</option>
            <option value="title_desc">{t('notes.sortByTitleDesc')}</option>
          </select>
        </div>
      </div>

      {/* Scrollable Note Cards */}
      <div className="flex-1 overflow-y-auto p-2.5 space-y-2 custom-scrollbar">
        {sortedNotes.length === 0 ? (
          <div className="py-16 text-center px-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-400/10 text-amber-500 flex items-center justify-center mx-auto mb-3 text-xl">
              <FaFolder />
            </div>
            <h4 className="text-sm font-bold text-stone-800 dark:text-zinc-200 mb-1">
              {t('notes.noNotesFound')}
            </h4>
            <p className="text-xs text-stone-400 dark:text-zinc-500 mb-4 max-w-[200px] mx-auto">
              {t('notes.noNotesDesc')}
            </p>
            {filterCategory !== 'trash' && (
              <button
                onClick={onCreateNote}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-400 text-stone-950 font-bold text-xs shadow-md shadow-amber-500/20 hover:bg-amber-500 transition-all"
              >
                <FaPlus className="text-[10px]" />
                <span>{t('notes.createNote')}</span>
              </button>
            )}
          </div>
        ) : (
          sortedNotes.map((note) => {
            const isActive = activeNoteId === note.id;
            const folder = note.folderId ? folderMap.get(note.folderId) : null;
            const hasScreenshots = note.attachments && note.attachments.length > 0;
            const firstScreenshot = hasScreenshots ? note.attachments![0].url : null;

            // Plain text excerpt
            const plainExcerpt = (note.content || '')
              .replace(/<[^>]*>/g, ' ')
              .replace(/!\[(.*?)\]\((.*?)\)/g, '')
              .replace(/\[(.*?)\]\((.*?)\)/g, '$1')
              .replace(/#{1,6}\s+/g, '')
              .replace(/(\*\*|\*|~~|`|==)/g, '')
              .trim();

            return (
              <div
                key={note.id}
                draggable={filterCategory !== 'trash'}
                onDragStart={(e) => {
                  e.dataTransfer.setData('text/plain', note.id);
                  e.dataTransfer.setData('noteId', note.id);
                  e.dataTransfer.effectAllowed = 'move';
                }}
                onClick={() => onSelectNote(note.id)}
                className={`group relative p-3 rounded-2xl border transition-all ${
                  filterCategory !== 'trash' ? 'cursor-grab active:cursor-grabbing' : 'cursor-pointer'
                } ${
                  isActive
                    ? 'bg-white dark:bg-zinc-800/90 border-amber-400 dark:border-amber-400/80 shadow-md ring-1 ring-amber-400/30'
                    : 'bg-white/70 dark:bg-zinc-900/60 border-stone-200/60 dark:border-zinc-800/60 hover:bg-white dark:hover:bg-zinc-800/60 hover:border-stone-300 dark:hover:border-zinc-700 shadow-sm'
                }`}
              >
                {/* Active Indicator Bar */}
                {isActive && (
                  <div className="absolute left-0 top-3 bottom-3 w-1 bg-amber-400 rounded-r-full" />
                )}

                <div className="flex items-start justify-between gap-2 mb-1 pl-1">
                  <div className="flex items-center gap-1.5 min-w-0 flex-1">
                    {filterCategory !== 'trash' && (
                      <span className="opacity-0 group-hover:opacity-60 text-stone-400 dark:text-zinc-500 text-[10px] -ml-1 shrink-0 cursor-grab" title={t('notes.dragToFolder')}>
                        <FaGripVertical />
                      </span>
                    )}
                    <h4 className="text-xs sm:text-sm font-bold text-stone-900 dark:text-white truncate flex-1">
                      {note.title || t('notes.untitledNote')}
                    </h4>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    {note.isPinned && (
                      <FaThumbtack className="text-amber-500 text-[10px]" title="Sabitlenmiş" />
                    )}
                    {note.isFavorite && (
                      <FaStar className="text-amber-400 text-[10px]" title="Favori" />
                    )}

                    {/* 3-dots Context Menu Button */}
                    <div className="relative">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveMenuNoteId(activeMenuNoteId === note.id ? null : note.id);
                        }}
                        className="p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-stone-100 dark:hover:bg-zinc-700 text-stone-400 dark:text-zinc-500 hover:text-stone-700 dark:hover:text-zinc-200 transition-all text-xs"
                      >
                        <FaEllipsisV />
                      </button>

                      {activeMenuNoteId === note.id && (
                        <div
                          className="absolute right-0 top-full mt-1 w-44 bg-white dark:bg-zinc-900 rounded-xl shadow-xl border border-stone-200 dark:border-zinc-800 py-1 z-30 text-xs"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {filterCategory === 'trash' ? (
                            <>
                              <button
                                onClick={() => {
                                  setActiveMenuNoteId(null);
                                  onRestoreNote(note.id);
                                }}
                                className="w-full flex items-center gap-2 px-3 py-2 text-stone-700 dark:text-zinc-300 hover:bg-stone-100 dark:hover:bg-zinc-800 text-left font-medium"
                              >
                                <FaUndo className="text-[10px] text-emerald-500" />
                                <span>{t('notes.restore')}</span>
                              </button>
                              <button
                                onClick={() => {
                                  setActiveMenuNoteId(null);
                                  if (confirm(t('notes.confirmDeletePermanently'))) {
                                    onDeleteNote(note.id, true);
                                  }
                                }}
                                className="w-full flex items-center gap-2 px-3 py-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 text-left font-medium"
                              >
                                <FaTrashAlt className="text-[10px]" />
                                <span>{t('notes.deletePermanently')}</span>
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                onClick={() => {
                                  setActiveMenuNoteId(null);
                                  onTogglePin(note.id);
                                }}
                                className="w-full flex items-center gap-2 px-3 py-2 text-stone-700 dark:text-zinc-300 hover:bg-stone-100 dark:hover:bg-zinc-800 text-left font-medium"
                              >
                                <FaThumbtack className="text-[10px] text-amber-500" />
                                <span>{note.isPinned ? t('notes.unpin') : t('notes.pin')}</span>
                              </button>
                              <button
                                onClick={() => {
                                  setActiveMenuNoteId(null);
                                  onToggleFavorite(note.id);
                                }}
                                className="w-full flex items-center gap-2 px-3 py-2 text-stone-700 dark:text-zinc-300 hover:bg-stone-100 dark:hover:bg-zinc-800 text-left font-medium"
                              >
                                <FaStar className="text-[10px] text-amber-400" />
                                <span>{note.isFavorite ? t('notes.unfavorite') : t('notes.favoriteAction')}</span>
                              </button>
                              <div className="h-px bg-stone-100 dark:bg-zinc-800 my-1" />
                              <button
                                onClick={() => {
                                  setActiveMenuNoteId(null);
                                  onDeleteNote(note.id, false);
                                }}
                                className="w-full flex items-center gap-2 px-3 py-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 text-left font-medium"
                              >
                                <FaTrash className="text-[10px]" />
                                <span>{t('notes.moveToTrash')}</span>
                              </button>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Excerpt & Thumbnail Preview */}
                <div className="flex gap-2 pl-1 mb-2">
                  <p className="text-[11px] text-stone-500 dark:text-zinc-400 line-clamp-2 leading-relaxed flex-1">
                    {plainExcerpt || t('notes.noContent')}
                  </p>
                  {firstScreenshot && (
                    <div className="w-12 h-12 rounded-xl overflow-hidden bg-stone-100 dark:bg-zinc-800 shrink-0 border border-stone-200 dark:border-zinc-700 shadow-inner">
                      <img
                        src={firstScreenshot}
                        alt="Thumbnail"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                </div>

                {/* Footer Metadata (Folder Badge, Tags, Date) */}
                <div className="flex items-center justify-between gap-2 pt-1 border-t border-stone-100 dark:border-zinc-800/80 text-[10px] text-stone-400 dark:text-zinc-500 pl-1">
                  <div className="flex items-center gap-1.5 flex-wrap truncate">
                    {folder && (
                      <span
                        className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md font-medium text-stone-800 dark:text-zinc-200 bg-stone-100 dark:bg-zinc-800"
                        style={{ borderLeft: `3px solid ${folder.color || '#f59e0b'}` }}
                      >
                        {folder.name}
                      </span>
                    )}

                    {note.tags && note.tags.length > 0 && (
                      <span className="inline-flex items-center gap-0.5 text-stone-500 dark:text-zinc-400 bg-stone-100 dark:bg-zinc-800/60 px-1.5 py-0.5 rounded">
                        <FaHashtag className="text-[8px]" />
                        {note.tags[0]}
                        {note.tags.length > 1 && ` +${note.tags.length - 1}`}
                      </span>
                    )}

                    {hasScreenshots && (
                      <span className="inline-flex items-center gap-0.5 text-amber-600 dark:text-amber-400">
                        <FaCamera className="text-[9px]" />
                        {note.attachments!.length}
                      </span>
                    )}
                  </div>

                  <span className="shrink-0">{formatDate(note.updatedAt)}</span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
