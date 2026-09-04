// src/frontend/services/pdfImportHistoryService.ts
import { db } from '../../backend/config/firebaseConfig';
import { doc, getDoc, setDoc } from 'firebase/firestore';

export interface SavedPdfRecord {
  fileName: string;
  importedAt: number;
  count: number;
}

const LOCAL_STORAGE_KEY_PREFIX = 'saved_pdf_history_';

/**
 * Kullanıcının yerel bellekteki PDF geçmişini getirir
 */
export function getLocalSavedPdfHistory(userId?: string): Record<string, SavedPdfRecord> {
  if (!userId) return {};
  try {
    const raw = localStorage.getItem(`${LOCAL_STORAGE_KEY_PREFIX}${userId}`);
    return raw ? JSON.parse(raw) : {};
  } catch (e) {
    console.error('Error reading saved PDF history from localStorage:', e);
    return {};
  }
}

/**
 * Kullanıcının yerel bellekteki PDF geçmişini günceller
 */
function setLocalSavedPdfHistory(userId: string, history: Record<string, SavedPdfRecord>) {
  if (!userId) return;
  try {
    localStorage.setItem(`${LOCAL_STORAGE_KEY_PREFIX}${userId}`, JSON.stringify(history));
  } catch (e) {
    console.error('Error saving PDF history to localStorage:', e);
  }
}

/**
 * Firestore'dan kullanıcının kaydedilmiş PDF listesini çeker ve yerel belleği senkronize eder
 */
export async function syncSavedPdfHistory(userId?: string): Promise<Record<string, SavedPdfRecord>> {
  if (!userId) return {};
  const localHistory = getLocalSavedPdfHistory(userId);

  try {
    const docRef = doc(db, 'user_pdf_history', userId);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      const remoteData = snap.data()?.history || {};
      const merged = { ...localHistory, ...remoteData };
      setLocalSavedPdfHistory(userId, merged);
      return merged;
    }
  } catch (err) {
    console.warn('Could not fetch remote PDF history, using local cache:', err);
  }

  return localHistory;
}

/**
 * Bir PDF dosyasının daha önce kaydedilip kaydedilmediğini denetler
 */
export function isPdfPreviouslySaved(userId?: string, fileName?: string): { isSaved: boolean; record?: SavedPdfRecord } {
  if (!userId || !fileName) return { isSaved: false };
  const history = getLocalSavedPdfHistory(userId);
  const normalized = fileName.trim().toLowerCase();

  const matchKey = Object.keys(history).find(k => k.toLowerCase() === normalized);
  if (matchKey && history[matchKey]) {
    return { isSaved: true, record: history[matchKey] };
  }

  return { isSaved: false };
}

/**
 * SADECE "Hepsini Kaydet" tıklandığında dosyayı geçmişe ekler
 */
export async function markPdfAsSaved(userId: string, fileName: string, count: number): Promise<void> {
  if (!userId || !fileName) return;
  const history = getLocalSavedPdfHistory(userId);
  const normalizedKey = fileName.trim();

  const record: SavedPdfRecord = {
    fileName: normalizedKey,
    importedAt: Date.now(),
    count,
  };

  history[normalizedKey] = record;
  setLocalSavedPdfHistory(userId, history);

  // Firestore senkronizasyonu
  try {
    const docRef = doc(db, 'user_pdf_history', userId);
    await setDoc(docRef, { history }, { merge: true });
  } catch (err) {
    console.warn('Could not sync PDF history to Firestore:', err);
  }
}
