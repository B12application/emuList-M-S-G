// src/frontend/services/notesService.ts
import { db } from '../../backend/config/firebaseConfig';
import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
  query,
  where,
  orderBy,
  serverTimestamp,
  updateDoc
} from 'firebase/firestore';
import type { NoteItem, NoteFolder, NoteAttachment } from '../types/notes';

const NOTES_CACHE_KEY = 'emulist_notes_cache';
const FOLDERS_CACHE_KEY = 'emulist_note_folders_cache';

// Helper to save cache to localStorage
export const setLocalCache = (key: string, data: any) => {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (err) {
    console.warn('LocalStorage quota or access error:', err);
  }
};

// Helper to get cache from localStorage
export const getLocalCache = <T>(key: string, fallback: T): T => {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : fallback;
  } catch {
    return fallback;
  }
};

/**
 * Capture screen / tab / window screenshot directly using browser API
 */
export async function captureScreen(): Promise<string> {
  if (!navigator.mediaDevices || !navigator.mediaDevices.getDisplayMedia) {
    throw new Error('Tarayıcınız ekran görüntüsü alma özelliğini desteklemiyor.');
  }

  const stream = await navigator.mediaDevices.getDisplayMedia({
    video: {
      displaySurface: 'monitor',
    } as any,
    audio: false
  });

  return new Promise<string>((resolve, reject) => {
    const video = document.createElement('video');
    video.autoplay = true;
    video.muted = true;
    video.srcObject = stream;

    video.onloadedmetadata = async () => {
      try {
        await video.play();
        // Allow a short frame render
        await new Promise((r) => setTimeout(r, 150));

        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth || 1920;
        canvas.height = video.videoHeight || 1080;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          throw new Error('Canvas context oluşturulamadı');
        }

        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        // Convert to webp with high quality
        let dataUrl = canvas.toDataURL('image/webp', 0.88);
        if (!dataUrl || dataUrl.length < 50) {
          dataUrl = canvas.toDataURL('image/jpeg', 0.85);
        }

        // Clean up tracks
        stream.getTracks().forEach((track) => track.stop());
        video.srcObject = null;

        resolve(dataUrl);
      } catch (err) {
        stream.getTracks().forEach((track) => track.stop());
        reject(err);
      }
    };

    video.onerror = (err) => {
      stream.getTracks().forEach((track) => track.stop());
      reject(err);
    };
  });
}

/**
 * Compress an uploaded or pasted image file to optimized Base64
 */
export async function compressImageFile(
  file: File | Blob,
  maxWidth: number = 1920,
  maxHeight: number = 1920,
  quality: number = 0.85
): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > maxWidth || height > maxHeight) {
          if (width / height > maxWidth / maxHeight) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          } else {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(event.target?.result as string);
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL('image/webp', quality);
        resolve(dataUrl.length > 50 ? dataUrl : (event.target?.result as string));
      };
      img.onerror = () => {
        resolve(event.target?.result as string);
      };
    };
    reader.onerror = (error) => reject(error);
  });
}

/**
 * Realtime subscription to Notes in Firestore for the user
 */
export function subscribeToNotes(
  userId: string,
  onUpdate: (notes: NoteItem[]) => void,
  onError?: (err: any) => void
) {
  if (!userId) {
    onUpdate([]);
    return () => {};
  }

  const q = query(
    collection(db, 'notes'),
    where('userId', '==', userId)
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const notes: NoteItem[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        notes.push({
          id: docSnap.id,
          userId: data.userId || userId,
          title: data.title || '',
          content: data.content || '',
          folderId: data.folderId ?? null,
          tags: Array.isArray(data.tags) ? data.tags : [],
          isPinned: Boolean(data.isPinned),
          isFavorite: Boolean(data.isFavorite),
          isArchived: Boolean(data.isArchived),
          isTrash: Boolean(data.isTrash),
          color: data.color || undefined,
          coverImage: data.coverImage || undefined,
          attachments: Array.isArray(data.attachments) ? data.attachments : [],
          fontFamily: data.fontFamily || 'sans',
          fontSize: data.fontSize || 'base',
          lineHeight: data.lineHeight || 'normal',
          theme: data.theme || 'default',
          createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : (data.createdAt || new Date().toISOString()),
          updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate().toISOString() : (data.updatedAt || new Date().toISOString()),
        });
      });

      // Sort by pinned first, then updated date descending
      notes.sort((a, b) => {
        if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1;
        return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      });

      setLocalCache(NOTES_CACHE_KEY + '_' + userId, notes);
      onUpdate(notes);
    },
    (error) => {
      console.error('Notes subscription error:', error);
      // Fallback to local cache
      const cached = getLocalCache<NoteItem[]>(NOTES_CACHE_KEY + '_' + userId, []);
      onUpdate(cached);
      if (onError) onError(error);
    }
  );
}

/**
 * Realtime subscription to Note Folders in Firestore
 */
export function subscribeToFolders(
  userId: string,
  onUpdate: (folders: NoteFolder[]) => void,
  onError?: (err: any) => void
) {
  if (!userId) {
    onUpdate([]);
    return () => {};
  }

  const q = query(
    collection(db, 'noteFolders'),
    where('userId', '==', userId)
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const folders: NoteFolder[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        folders.push({
          id: docSnap.id,
          userId: data.userId || userId,
          name: data.name || 'İsimsiz Klasör',
          color: data.color || '#f59e0b',
          icon: data.icon || 'folder',
          parentId: data.parentId ?? null,
          order: typeof data.order === 'number' ? data.order : 0,
          isExpanded: data.isExpanded ?? true,
          createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : (data.createdAt || new Date().toISOString()),
          updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate().toISOString() : (data.updatedAt || new Date().toISOString()),
        });
      });

      folders.sort((a, b) => (a.order ?? 0) - (b.order ?? 0) || a.name.localeCompare(b.name));
      setLocalCache(FOLDERS_CACHE_KEY + '_' + userId, folders);
      onUpdate(folders);
    },
    (error) => {
      console.error('Folders subscription error:', error);
      const cached = getLocalCache<NoteFolder[]>(FOLDERS_CACHE_KEY + '_' + userId, []);
      onUpdate(cached);
      if (onError) onError(error);
    }
  );
}

/**
 * Save or update a note
 */
export async function saveNoteToFirestore(note: Partial<NoteItem> & { userId: string }): Promise<string> {
  const isNew = !note.id;
  const noteId = note.id || doc(collection(db, 'notes')).id;
  const now = new Date().toISOString();

  let noteData: any;

  if (isNew) {
    noteData = {
      id: noteId,
      userId: note.userId,
      title: note.title !== undefined ? note.title : 'Yeni Not',
      content: note.content !== undefined ? note.content : '',
      folderId: note.folderId ?? null,
      tags: Array.isArray(note.tags) ? note.tags : [],
      isPinned: Boolean(note.isPinned),
      isFavorite: Boolean(note.isFavorite),
      isArchived: Boolean(note.isArchived),
      isTrash: Boolean(note.isTrash),
      attachments: Array.isArray(note.attachments) ? note.attachments : [],
      fontFamily: note.fontFamily || 'sans',
      fontSize: note.fontSize || 'base',
      lineHeight: note.lineHeight || 'normal',
      theme: note.theme || 'default',
      createdAt: note.createdAt || now,
      updatedAt: now,
    };
  } else {
    noteData = {
      ...note,
      id: noteId,
      updatedAt: now,
    };
    // Strip undefined keys
    Object.keys(noteData).forEach((key) => {
      if (noteData[key] === undefined) {
        delete noteData[key];
      }
    });
  }

  await setDoc(doc(db, 'notes', noteId), noteData, { merge: true });
  return noteId;
}

/**
 * Delete a note permanently or move to trash
 */
export async function deleteNoteFromFirestore(noteId: string, permanent: boolean = false): Promise<void> {
  if (permanent) {
    await deleteDoc(doc(db, 'notes', noteId));
  } else {
    await updateDoc(doc(db, 'notes', noteId), {
      isTrash: true,
      updatedAt: new Date().toISOString()
    });
  }
}

/**
 * Restore note from trash
 */
export async function restoreNoteFromTrash(noteId: string): Promise<void> {
  await updateDoc(doc(db, 'notes', noteId), {
    isTrash: false,
    updatedAt: new Date().toISOString()
  });
}

/**
 * Save or update a folder
 */
export async function saveFolderToFirestore(folder: Partial<NoteFolder> & { userId: string }): Promise<string> {
  const isNew = !folder.id;
  const folderId = folder.id || doc(collection(db, 'noteFolders')).id;
  const now = new Date().toISOString();

  let folderData: any;

  if (isNew) {
    folderData = {
      id: folderId,
      userId: folder.userId,
      name: folder.name || 'Yeni Klasör',
      color: folder.color || '#f59e0b',
      icon: folder.icon || 'folder',
      parentId: folder.parentId ?? null,
      order: folder.order ?? 0,
      createdAt: folder.createdAt || now,
      updatedAt: now,
    };
  } else {
    folderData = {
      ...folder,
      id: folderId,
      updatedAt: now,
    };
    Object.keys(folderData).forEach((key) => {
      if (folderData[key] === undefined) {
        delete folderData[key];
      }
    });
  }

  await setDoc(doc(db, 'noteFolders', folderId), folderData, { merge: true });
  return folderId;
}

/**
 * Delete a folder and unassign associated notes
 */
export async function deleteFolderFromFirestore(folderId: string, notesToUnassign: NoteItem[] = []): Promise<void> {
  // 1. Delete folder
  await deleteDoc(doc(db, 'noteFolders', folderId));

  // 2. Remove folderId from contained notes
  const promises = notesToUnassign
    .filter((n) => n.folderId === folderId)
    .map((n) => updateDoc(doc(db, 'notes', n.id), { folderId: null }));

  await Promise.all(promises);
}
