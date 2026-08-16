// src/frontend/hooks/useNotes.ts
import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import type { NoteItem, NoteFolder, NoteAttachment, NoteTheme, NoteFontFamily, NoteFontSize, NoteLineHeight } from '../types/notes';
import {
  subscribeToNotes,
  subscribeToFolders,
  saveNoteToFirestore,
  deleteNoteFromFirestore,
  restoreNoteFromTrash,
  saveFolderToFirestore,
  deleteFolderFromFirestore,
  captureScreen,
  compressImageFile
} from '../services/notesService';
import toast from 'react-hot-toast';

export type FilterCategory = 'all' | 'recent' | 'favorites' | 'pinned' | 'trash' | 'folder' | 'tag';

export function useNotes(initialNoteId?: string) {
  const { user } = useAuth();
  const [notes, setNotes] = useState<NoteItem[]>([]);
  const [folders, setFolders] = useState<NoteFolder[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const [activeNoteId, setActiveNoteId] = useState<string | null>(initialNoteId || null);
  const [activeFolderId, setActiveFolderId] = useState<string | null>(null);
  const [filterCategory, setFilterCategory] = useState<FilterCategory>('all');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Auto-save status: 'idle' | 'saving' | 'saved'
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('saved');
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const pendingUpdatesRef = useRef<{ noteId: string; updates: Partial<NoteItem> } | null>(null);

  // Subscribe to notes & folders in Firestore
  useEffect(() => {
    if (!user) {
      setNotes([]);
      setFolders([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    const unsubNotes = subscribeToNotes(
      user.uid,
      (fetchedNotes) => {
        const pending = pendingUpdatesRef.current;
        if (pending) {
          const patched = fetchedNotes.map(n => 
            n.id === pending.noteId ? { ...n, ...pending.updates } : n
          );
          setNotes(patched);
        } else {
          setNotes(fetchedNotes);
        }
        setLoading(false);
      },
      () => setLoading(false)
    );

    const unsubFolders = subscribeToFolders(
      user.uid,
      (fetchedFolders) => {
        setFolders(fetchedFolders);
      }
    );

    return () => {
      unsubNotes();
      unsubFolders();
    };
  }, [user]);

  // Flush pending updates when note changes or on unmount
  useEffect(() => {
    const flushPending = () => {
      if (pendingUpdatesRef.current && user) {
        saveNoteToFirestore({
          id: pendingUpdatesRef.current.noteId,
          userId: user.uid,
          ...pendingUpdatesRef.current.updates,
        }).catch((err) => console.error('Flush save error:', err));
        pendingUpdatesRef.current = null;
      }
    };

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
      flushPending();
    };
  }, [activeNoteId, user]);

  // Flush on tab close
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (pendingUpdatesRef.current && user) {
        saveNoteToFirestore({
          id: pendingUpdatesRef.current.noteId,
          userId: user.uid,
          ...pendingUpdatesRef.current.updates,
        });
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [user]);

  // If initialNoteId changes externally
  useEffect(() => {
    if (initialNoteId) {
      setActiveNoteId(initialNoteId);
    }
  }, [initialNoteId]);

  // Compute active note
  const activeNote = useMemo(() => {
    if (!activeNoteId) return null;
    return notes.find((n) => n.id === activeNoteId) || null;
  }, [notes, activeNoteId]);

  // Compute all unique tags from non-trash notes
  const allTags = useMemo(() => {
    const tagCountMap: Record<string, number> = {};
    notes
      .filter((n) => !n.isTrash)
      .forEach((n) => {
        n.tags?.forEach((tag) => {
          const clean = tag.trim().toLowerCase();
          if (clean) {
            tagCountMap[clean] = (tagCountMap[clean] || 0) + 1;
          }
        });
      });

    return Object.entries(tagCountMap)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
  }, [notes]);

  // Filtered notes list based on sidebar selections & search
  const filteredNotes = useMemo(() => {
    return notes.filter((note) => {
      // Trash filtering
      if (filterCategory === 'trash') {
        if (!note.isTrash) return false;
      } else {
        if (note.isTrash) return false;
      }

      // Filter category
      if (filterCategory === 'favorites' && !note.isFavorite) return false;
      if (filterCategory === 'pinned' && !note.isPinned) return false;
      if (filterCategory === 'folder' && activeFolderId !== null) {
        if (note.folderId !== activeFolderId) return false;
      }
      if (filterCategory === 'tag' && selectedTag) {
        const hasTag = note.tags?.some(
          (t) => t.trim().toLowerCase() === selectedTag.trim().toLowerCase()
        );
        if (!hasTag) return false;
      }

      // Search query filtering
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const inTitle = note.title?.toLowerCase().includes(query);
        const inContent = note.content?.toLowerCase().includes(query);
        const inTags = note.tags?.some((t) => t.toLowerCase().includes(query));
        if (!inTitle && !inContent && !inTags) return false;
      }

      return true;
    });
  }, [notes, filterCategory, activeFolderId, selectedTag, searchQuery]);

  // Select first note automatically if none selected on desktop
  useEffect(() => {
    if (!activeNoteId && filteredNotes.length > 0 && window.innerWidth >= 768) {
      setActiveNoteId(filteredNotes[0].id);
    }
  }, [filteredNotes, activeNoteId]);

  // Create a new note
  const createNote = useCallback(
    async (folderId?: string | null, title: string = 'Yeni Not', initialContent: string = '') => {
      if (!user) {
        toast.error('Not oluşturmak için giriş yapmalısınız');
        return null;
      }

      try {
        const targetFolder = folderId !== undefined ? folderId : activeFolderId;
        const newNoteData: Partial<NoteItem> & { userId: string } = {
          userId: user.uid,
          title,
          content: initialContent,
          folderId: targetFolder,
          tags: selectedTag ? [selectedTag] : [],
          isPinned: false,
          isFavorite: false,
          isTrash: false,
          attachments: [],
          fontFamily: 'sans',
          fontSize: 'base',
          lineHeight: 'normal',
          theme: 'default',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        const newId = await saveNoteToFirestore(newNoteData);
        setActiveNoteId(newId);
        toast.success('Yeni not oluşturuldu', { id: 'note-action' });
        return newId;
      } catch (err) {
        console.error('Create note error:', err);
        toast.error('Not oluşturulamadı', { id: 'note-action' });
        return null;
      }
    },
    [user, activeFolderId, selectedTag]
  );

  // Update active note with debouncing and optimistic local state
  const updateNote = useCallback(
    (updates: Partial<NoteItem>) => {
      if (!activeNoteId || !user) return;

      setSaveStatus('saving');

      // Optimistic update in state
      setNotes((prev) =>
        prev.map((n) => {
          if (n.id === activeNoteId) {
            return {
              ...n,
              ...updates,
              updatedAt: new Date().toISOString(),
            };
          }
          return n;
        })
      );

      // Accumulate pending updates
      const currentPending =
        pendingUpdatesRef.current?.noteId === activeNoteId
          ? pendingUpdatesRef.current.updates
          : {};
      const mergedUpdates = { ...currentPending, ...updates };
      pendingUpdatesRef.current = { noteId: activeNoteId, updates: mergedUpdates };

      // Debounce Firestore write (350ms)
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }

      const noteToSaveId = activeNoteId;
      saveTimeoutRef.current = setTimeout(async () => {
        try {
          await saveNoteToFirestore({
            id: noteToSaveId,
            userId: user.uid,
            ...mergedUpdates,
          });
          if (pendingUpdatesRef.current?.noteId === noteToSaveId) {
            pendingUpdatesRef.current = null;
          }
          setSaveStatus('saved');
        } catch (err) {
          console.error('Error saving note:', err);
          setSaveStatus('idle');
        }
      }, 350);
    },
    [activeNoteId, user]
  );

  // Toggle Pin
  const togglePin = useCallback(
    async (noteId?: string) => {
      const targetId = noteId || activeNoteId;
      if (!targetId || !user) return;
      const target = notes.find((n) => n.id === targetId);
      if (!target) return;

      const newPinned = !target.isPinned;
      // Optimistic
      setNotes((prev) =>
        prev.map((n) => (n.id === targetId ? { ...n, isPinned: newPinned } : n))
      );

      await saveNoteToFirestore({
        id: targetId,
        userId: user.uid,
        isPinned: newPinned,
      });

      toast.success(newPinned ? 'Not başa sabitlendi' : 'Sabitleme kaldırıldı', { id: 'note-action' });
    },
    [activeNoteId, user, notes]
  );

  // Toggle Favorite
  const toggleFavorite = useCallback(
    async (noteId?: string) => {
      const targetId = noteId || activeNoteId;
      if (!targetId || !user) return;
      const target = notes.find((n) => n.id === targetId);
      if (!target) return;

      const newFav = !target.isFavorite;
      // Optimistic
      setNotes((prev) =>
        prev.map((n) => (n.id === targetId ? { ...n, isFavorite: newFav } : n))
      );

      await saveNoteToFirestore({
        id: targetId,
        userId: user.uid,
        isFavorite: newFav,
      });

      toast.success(newFav ? 'Favorilere eklendi' : 'Favorilerden çıkarıldı', { id: 'note-action' });
    },
    [activeNoteId, user, notes]
  );

  // Move note to trash or delete permanently
  const deleteNote = useCallback(
    async (noteId?: string, permanent: boolean = false) => {
      const targetId = noteId || activeNoteId;
      if (!targetId) return;

      try {
        await deleteNoteFromFirestore(targetId, permanent);

        // Remove or update locally
        setNotes((prev) => {
          if (permanent) {
            return prev.filter((n) => n.id !== targetId);
          } else {
            return prev.map((n) =>
              n.id === targetId ? { ...n, isTrash: true } : n
            );
          }
        });

        if (activeNoteId === targetId) {
          const remaining = filteredNotes.filter((n) => n.id !== targetId);
          setActiveNoteId(remaining.length > 0 ? remaining[0].id : null);
        }

        toast.success(permanent ? 'Not kalıcı olarak silindi' : 'Not çöp kutusuna taşındı', { id: 'note-action' });
      } catch (err) {
        console.error('Delete note error:', err);
        toast.error('Not silinemedi', { id: 'note-action' });
      }
    },
    [activeNoteId, filteredNotes]
  );

  // Restore note from trash
  const restoreNote = useCallback(
    async (noteId?: string) => {
      const targetId = noteId || activeNoteId;
      if (!targetId) return;

      try {
        await restoreNoteFromTrash(targetId);
        setNotes((prev) =>
          prev.map((n) => (n.id === targetId ? { ...n, isTrash: false } : n))
        );
        toast.success('Not geri yüklendi', { id: 'note-action' });
      } catch (err) {
        console.error('Restore error:', err);
        toast.error('Geri yüklenemedi', { id: 'note-action' });
      }
    },
    [activeNoteId]
  );

  // Empty trash
  const emptyTrash = useCallback(async () => {
    try {
      const trashNotes = notes.filter(n => n.isTrash);
      if (trashNotes.length === 0) {
        toast.success('Çöp kutusu zaten boş', { id: 'note-action' });
        return;
      }
      
      const toastId = toast.loading('Çöp kutusu boşaltılıyor...');
      await Promise.all(trashNotes.map(n => deleteNoteFromFirestore(n.id, true)));
      
      setNotes(prev => prev.filter(n => !n.isTrash));
      if (activeNoteId && trashNotes.some(n => n.id === activeNoteId)) {
        setActiveNoteId(null);
      }
      
      toast.success('Çöp kutusu boşaltıldı', { id: toastId });
    } catch (err) {
      console.error('Empty trash error:', err);
      toast.error('Çöp kutusu boşaltılamadı', { id: 'note-action' });
    }
  }, [notes, activeNoteId]);

  // Move note to specific folder
  const moveNoteToFolder = useCallback(
    async (noteId: string, folderId: string | null) => {
      if (!user) return;
      try {
        setNotes((prev) =>
          prev.map((n) => (n.id === noteId ? { ...n, folderId } : n))
        );
        await saveNoteToFirestore({
          id: noteId,
          userId: user.uid,
          folderId,
        });
        toast.success('Not taşındı', { id: 'note-action' });
      } catch (err) {
        console.error('Move note error:', err);
        toast.error('Taşıma başarısız oldu', { id: 'note-action' });
      }
    },
    [user]
  );

  // Create folder
  const createFolder = useCallback(
    async (name: string, color?: string, parentId?: string | null) => {
      if (!user) return null;
      try {
        const folderId = await saveFolderToFirestore({
          userId: user.uid,
          name: name.trim() || 'Yeni Klasör',
          color: color || '#f59e0b',
          parentId: parentId ?? null,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
        toast.success(`"${name}" klasörü oluşturuldu`, { id: 'note-action' });
        return folderId;
      } catch (err) {
        console.error('Create folder error:', err);
        toast.error('Klasör oluşturulamadı', { id: 'note-action' });
        return null;
      }
    },
    [user]
  );

  // Update folder
  const updateFolder = useCallback(
    async (folderId: string, updates: Partial<NoteFolder>) => {
      if (!user) return;
      try {
        await saveFolderToFirestore({
          id: folderId,
          userId: user.uid,
          ...updates,
        });
        toast.success('Klasör güncellendi', { id: 'note-action' });
      } catch (err) {
        console.error('Update folder error:', err);
        toast.error('Klasör güncellenemedi', { id: 'note-action' });
      }
    },
    [user]
  );

  // Delete folder
  const deleteFolder = useCallback(
    async (folderId: string) => {
      try {
        await deleteFolderFromFirestore(folderId, notes);
        if (activeFolderId === folderId) {
          setActiveFolderId(null);
          setFilterCategory('all');
        }
        toast.success('Klasör silindi');
      } catch (err) {
        console.error('Delete folder error:', err);
        toast.error('Klasör silinemedi');
      }
    },
    [notes, activeFolderId]
  );

  // Capture screen and attach to active note
  const captureAndAttachScreen = useCallback(async (): Promise<NoteAttachment | null> => {
    if (!activeNote || !user) {
      toast.error('Lütfen önce bir not seçin veya oluşturun', { id: 'note-action' });
      return null;
    }

    const toastId = toast.loading('Ekran görüntüsü alınıyor...', { id: 'note-action' });
    try {
      const dataUrl = await captureScreen();
      const newAttachment: NoteAttachment = {
        id: 'screen_' + Date.now(),
        name: `Ekran Görüntüsü ${new Date().toLocaleTimeString('tr-TR')}`,
        url: dataUrl,
        type: 'screenshot',
        createdAt: new Date().toISOString(),
      };

      const updatedAttachments = [...(activeNote.attachments || []), newAttachment];

      updateNote({
        attachments: updatedAttachments,
      });

      toast.success('Ekran görüntüsü nota eklendi!', { id: toastId });
      return newAttachment;
    } catch (err: any) {
      console.error('Screen capture error:', err);
      if (err.name === 'NotAllowedError') {
        toast.dismiss(toastId);
      } else {
        toast.error(err.message || 'Ekran görüntüsü alınamadı', { id: toastId });
      }
      return null;
    }
  }, [activeNote, user, updateNote]);

  // Attach uploaded image
  const attachImageFile = useCallback(
    async (file: File): Promise<NoteAttachment | null> => {
      if (!activeNote || !user) {
        toast.error('Lütfen önce bir not seçin veya oluşturun', { id: 'note-action' });
        return null;
      }

      const toastId = toast.loading('Resim işleniyor...', { id: 'note-action' });
      try {
        const compressedBase64 = await compressImageFile(file);
        const newAttachment: NoteAttachment = {
          id: 'img_' + Date.now(),
          name: file.name || `Görsel ${new Date().toLocaleTimeString('tr-TR')}`,
          url: compressedBase64,
          type: 'image',
          size: file.size,
          createdAt: new Date().toISOString(),
        };

        const updatedAttachments = [...(activeNote.attachments || []), newAttachment];
        
        updateNote({
          attachments: updatedAttachments,
        });

        toast.success('Görsel nota eklendi!', { id: toastId });
        return newAttachment;
      } catch (err: any) {
        console.error('Image attach error:', err);
        toast.error('Görsel eklenemedi', { id: toastId });
        return null;
      }
    },
    [activeNote, user, updateNote]
  );

  return {
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
  };
}
