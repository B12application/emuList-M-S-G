// src/frontend/pages/NotesPage.tsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FaPlus,
  FaBars,
  FaFolderPlus,
  FaColumns,
  FaSpinner,
  FaStickyNote,
  FaChevronLeft,
  FaChevronRight
} from 'react-icons/fa';
import { useLanguage } from '../context/LanguageContext';
import { useNotes } from '../hooks/useNotes';
import NotesSidebar from '../components/notes/NotesSidebar';
import NotesList from '../components/notes/NotesList';
import NotesEditor from '../components/notes/NotesEditor';
import FolderModal from '../components/notes/FolderModal';
import type { NoteFolder } from '../types/notes';

export default function NotesPage() {
  const { t } = useLanguage();
  const { noteId } = useParams<{ noteId?: string }>();
  const navigate = useNavigate();

  const {
    notes,
    folders,
    loading,
    activeNoteId,
    activeNote,
    activeFolderId,
    filterCategory,
    selectedTag,
    searchQuery,
    filteredNotes,
    allTags,
    saveStatus,
    setActiveNoteId,
    setActiveFolderId,
    setFilterCategory,
    setSelectedTag,
    setSearchQuery,
    createNote,
    updateNote,
    deleteNote,
    emptyTrash,
    restoreNote,
    moveNoteToFolder,
    togglePin,
    toggleFavorite,
    createFolder,
    updateFolder,
    deleteFolder,
    captureAndAttachScreen,
    attachImageFile,
  } = useNotes(noteId);

  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isNotesListCollapsed, setIsNotesListCollapsed] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isFolderModalOpen, setIsFolderModalOpen] = useState(false);
  const [folderToEdit, setFolderToEdit] = useState<NoteFolder | null>(null);
  const [mobileView, setMobileView] = useState<'list' | 'editor'>('list');

  // Sync mobile view with activeNote
  useEffect(() => {
    if (activeNoteId && window.innerWidth < 768) {
      setMobileView('editor');
    }
  }, [activeNoteId]);

  // Sync URL when activeNoteId changes
  const handleSelectNote = (id: string) => {
    setActiveNoteId(id);
    navigate(`/notes/${id}`, { replace: true });
    if (window.innerWidth < 768) {
      setMobileView('editor');
    }
  };

  const handleCreateNewNote = async (folderId?: string | null) => {
    const newId = await createNote(folderId);
    if (newId) {
      navigate(`/notes/${newId}`, { replace: true });
      if (window.innerWidth < 768) {
        setMobileView('editor');
      }
    }
  };

  const handleOpenFolderModal = (folder?: NoteFolder | null) => {
    setFolderToEdit(folder || null);
    setIsFolderModalOpen(true);
  };

  const handleSaveFolder = async (name: string, color: string, parentId: string | null) => {
    if (folderToEdit) {
      await updateFolder(folderToEdit.id, { name, color, parentId });
    } else {
      await createFolder(name, color, parentId);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[75vh] flex flex-col items-center justify-center">
        <FaSpinner className="animate-spin text-4xl text-amber-500 mb-4" />
        <p className="text-sm font-semibold text-stone-600 dark:text-zinc-400">
          {t('notes.loadingNotes')}
        </p>
      </div>
    );
  }

  return (
    <div className="mt-6 md:mt-8 h-[calc(100vh-15rem)] md:h-[calc(100vh-11rem)] w-full flex flex-col overflow-hidden bg-white/70 dark:bg-zinc-950/70 rounded-3xl border border-stone-200/80 dark:border-zinc-800/80 shadow-2xl backdrop-blur-2xl">
      {/* DESKTOP LAYOUT (>= md) */}
      <div className="hidden md:flex h-full w-full overflow-hidden">
        {/* Left Sidebar (Collapsible) */}
        <div
          className={`transition-all duration-300 relative ${isSidebarCollapsed ? 'w-0 overflow-hidden' : 'w-64 lg:w-72 shrink-0'
            }`}
        >
          <NotesSidebar
            folders={folders}
            notes={notes}
            activeFolderId={activeFolderId}
            activeNoteId={activeNoteId}
            filterCategory={filterCategory}
            selectedTag={selectedTag}
            searchQuery={searchQuery}
            allTags={allTags}
            onSelectCategory={(category, fId) => {
              setFilterCategory(category);
              setActiveFolderId(fId ?? null);
              setSelectedTag(null);
            }}
            onSelectTag={(tag) => {
              setSelectedTag(tag);
              setFilterCategory('tag');
            }}
            onSearchChange={setSearchQuery}
            onSelectNote={handleSelectNote}
            onCreateNote={handleCreateNewNote}
            onOpenFolderModal={handleOpenFolderModal}
            onDeleteFolder={deleteFolder}
            onMoveToFolder={moveNoteToFolder}
            onDeleteNote={deleteNote}
          />
        </div>

        {/* Sidebar Toggle Button */}
        <div className="relative z-30 h-full w-0 flex items-start">
          <button
            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            className="absolute -left-3 top-[30%] -translate-y-1/2 p-1.5 rounded-full bg-white dark:bg-zinc-900 border border-stone-200 dark:border-zinc-800 shadow-md text-stone-500 hover:text-amber-500 transition-all text-xs"
            title={isSidebarCollapsed ? t('notes.showFolders') : t('notes.hideFolders')}
          >
            {isSidebarCollapsed ? <FaChevronRight /> : <FaChevronLeft />}
          </button>
        </div>

        {/* Middle: Notes List (Collapsible) */}
        <div
          className={`transition-all duration-300 relative ${
            isNotesListCollapsed ? 'w-0 overflow-hidden' : 'w-60 lg:w-64 shrink-0 h-full overflow-hidden'
          }`}
        >
          <NotesList
            notes={filteredNotes}
            folders={folders}
            activeNoteId={activeNoteId}
            activeFolderId={activeFolderId}
            filterCategory={filterCategory}
            selectedTag={selectedTag}
            searchQuery={searchQuery}
            onSelectNote={handleSelectNote}
            onCreateNote={() => handleCreateNewNote(activeFolderId)}
            onTogglePin={togglePin}
            onToggleFavorite={toggleFavorite}
            onDeleteNote={deleteNote}
            onRestoreNote={restoreNote}
            onMoveToFolder={moveNoteToFolder}
            onEmptyTrash={emptyTrash}
          />
        </div>

        {/* Notes List Toggle Button */}
        <div className="relative z-30 h-full w-0 flex items-start">
          <button
            onClick={() => setIsNotesListCollapsed(!isNotesListCollapsed)}
            className="absolute -left-3 top-[50%] -translate-y-1/2 p-1.5 rounded-full bg-white dark:bg-zinc-900 border border-stone-200 dark:border-zinc-800 shadow-md text-stone-500 hover:text-amber-500 transition-all text-xs"
            title={isNotesListCollapsed ? t('notes.showNotesList') : t('notes.hideNotesList')}
          >
            {isNotesListCollapsed ? <FaChevronRight /> : <FaChevronLeft />}
          </button>
        </div>

        {/* Right: Notes Editor & Live Preview */}
        <div className="flex-1 h-full overflow-hidden">
          <NotesEditor
            note={activeNote}
            folders={folders}
            saveStatus={saveStatus}
            onUpdateNote={updateNote}
            onTogglePin={togglePin}
            onToggleFavorite={toggleFavorite}
            onDeleteNote={deleteNote}
            onCaptureScreen={captureAndAttachScreen}
            onAttachImageFile={attachImageFile}
            isMobile={false}
          />
        </div>
      </div>

      {/* MOBILE LAYOUT (< md) */}
      <div className="flex md:hidden h-full w-full flex-col overflow-hidden relative">
        {/* Mobile View: List or Editor */}
        {mobileView === 'list' ? (
          <div className="h-full flex flex-col">
            {/* Top bar for mobile */}
            <div className="p-3 bg-white/90 dark:bg-zinc-900/90 border-b border-stone-200 dark:border-zinc-800 flex items-center justify-between shrink-0">
              <button
                onClick={() => setIsMobileSidebarOpen(true)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-stone-100 dark:bg-zinc-800 text-xs font-bold text-stone-700 dark:text-zinc-300"
              >
                <FaBars className="text-amber-500" />
                <span>{t('notes.foldersAndMenu')}</span>
              </button>

              <button
                onClick={() => handleCreateNewNote(activeFolderId)}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-amber-400 text-stone-950 font-bold text-xs shadow-md shadow-amber-500/25"
              >
                <FaPlus />
                <span>{t('notes.newNote')}</span>
              </button>
            </div>

            <div className="flex-1 overflow-hidden">
              <NotesList
                notes={filteredNotes}
                folders={folders}
                activeNoteId={activeNoteId}
                activeFolderId={activeFolderId}
                filterCategory={filterCategory}
                selectedTag={selectedTag}
                searchQuery={searchQuery}
                onSelectNote={handleSelectNote}
                onCreateNote={() => handleCreateNewNote(activeFolderId)}
                onTogglePin={togglePin}
                onToggleFavorite={toggleFavorite}
                onDeleteNote={deleteNote}
                onRestoreNote={restoreNote}
                onMoveToFolder={moveNoteToFolder}
                onEmptyTrash={emptyTrash}
              />
            </div>
          </div>
        ) : (
          <div className="h-full flex flex-col">
            <NotesEditor
              note={activeNote}
              folders={folders}
              saveStatus={saveStatus}
              onUpdateNote={updateNote}
              onTogglePin={togglePin}
              onToggleFavorite={toggleFavorite}
              onDeleteNote={deleteNote}
              onCaptureScreen={captureAndAttachScreen}
              onAttachImageFile={attachImageFile}
              onBackToList={() => setMobileView('list')}
              isMobile={true}
            />
          </div>
        )}

        {/* Mobile Drawer for Sidebar */}
        <AnimatePresence>
          {isMobileSidebarOpen && (
            <div className="fixed inset-0 z-[120] md:hidden">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={() => setIsMobileSidebarOpen(false)}
              />

              <motion.div
                initial={{ x: '-100%' }}
                animate={{ x: 0 }}
                exit={{ x: '-100%' }}
                transition={{ type: 'spring', damping: 25 }}
                className="absolute top-0 bottom-0 left-0 w-[80vw] max-w-xs bg-white dark:bg-zinc-950 shadow-2xl z-10 overflow-hidden flex flex-col"
              >
                <NotesSidebar
                  folders={folders}
                  notes={notes}
                  activeFolderId={activeFolderId}
                  activeNoteId={activeNoteId}
                  filterCategory={filterCategory}
                  selectedTag={selectedTag}
                  searchQuery={searchQuery}
                  allTags={allTags}
                  onSelectCategory={(category, fId) => {
                    setFilterCategory(category);
                    setActiveFolderId(fId ?? null);
                    setSelectedTag(null);
                    setIsMobileSidebarOpen(false);
                    setMobileView('list');
                  }}
                  onSelectTag={(tag) => {
                    setSelectedTag(tag);
                    setFilterCategory('tag');
                    setIsMobileSidebarOpen(false);
                    setMobileView('list');
                  }}
                  onSearchChange={setSearchQuery}
                  onSelectNote={(nId) => {
                    handleSelectNote(nId);
                    setIsMobileSidebarOpen(false);
                  }}
                  onCreateNote={(fId) => {
                    setIsMobileSidebarOpen(false);
                    handleCreateNewNote(fId);
                  }}
                  onOpenFolderModal={(f) => {
                    setIsMobileSidebarOpen(false);
                    handleOpenFolderModal(f);
                  }}
                  onDeleteFolder={deleteFolder}
                  onMoveToFolder={moveNoteToFolder}
                  onDeleteNote={deleteNote}
                  isMobileDrawer={true}
                  onCloseMobileDrawer={() => setIsMobileSidebarOpen(false)}
                />
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>

      {/* Folder Create/Edit Modal */}
      <FolderModal
        isOpen={isFolderModalOpen}
        onClose={() => setIsFolderModalOpen(false)}
        folderToEdit={folderToEdit}
        folders={folders}
        onSave={handleSaveFolder}
      />
    </div>
  );
}
