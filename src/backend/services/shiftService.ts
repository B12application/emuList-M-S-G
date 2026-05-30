import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../config/firebaseConfig';

export interface ShiftSettings {
  planMode: '3-person' | '2-person';
  refDate3: string; // ISO format string: YYYY-MM-DD (Default: '2026-04-04')
  refDate2: string; // ISO format string: YYYY-MM-DD (Default: '2026-03-30', which is a Monday)
  overrides: Record<string, 'Sabah' | 'Akşam' | 'Tatil' | 'Nöbet'>; // Date overrides mapping date -> ShiftType
}

export const DEFAULT_SHIFT_SETTINGS: ShiftSettings = {
  planMode: '3-person',
  refDate3: '2026-04-04',
  refDate2: '2026-03-30',
  overrides: {},
};

/**
 * Fetches user shift settings from Firestore, falling back to defaults if not found.
 */
export async function getUserShiftSettings(userId: string): Promise<ShiftSettings> {
  try {
    const docRef = doc(db, 'users', userId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const data = docSnap.data();
      if (data.shiftSettings) {
        return {
          ...DEFAULT_SHIFT_SETTINGS,
          ...data.shiftSettings,
        };
      }
    }
    return DEFAULT_SHIFT_SETTINGS;
  } catch (error) {
    console.error('Error fetching shift settings:', error);
    return DEFAULT_SHIFT_SETTINGS;
  }
}

/**
 * Saves user shift settings to Firestore.
 */
export async function saveUserShiftSettings(userId: string, settings: ShiftSettings): Promise<void> {
  try {
    const docRef = doc(db, 'users', userId);
    await setDoc(docRef, { shiftSettings: settings }, { merge: true });
  } catch (error) {
    console.error('Error saving shift settings:', error);
    throw error;
  }
}
