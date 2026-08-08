import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../config/firebaseConfig';

export type ShiftType = 'Sabah' | 'Akşam' | 'Tatil' | 'Nöbet';

export interface ShiftCustomHours {
  Sabah?: { start: string; end: string };
  Akşam?: { start: string; end: string };
  Nöbet?: { start: string; end: string };
}

export interface ShiftSettings {
  enableShiftSystem?: boolean;
  planMode: '3-person' | '2-person' | 'custom-weekly' | 'custom-cycle';
  refDate3: string; // ISO format string: YYYY-MM-DD
  refDate2: string; // ISO format string: YYYY-MM-DD
  refDateCustom?: string; // ISO format string: YYYY-MM-DD
  weeklyPattern?: [ShiftType, ShiftType, ShiftType, ShiftType, ShiftType, ShiftType, ShiftType];
  customCycle?: ShiftType[];
  customHours?: ShiftCustomHours;
  overrides: Record<string, ShiftType>; // Date overrides mapping date -> ShiftType
}

export const DEFAULT_SHIFT_SETTINGS: ShiftSettings = {
  enableShiftSystem: false,
  planMode: 'custom-weekly',
  refDate3: '2026-04-04',
  refDate2: '2026-03-30',
  refDateCustom: '2026-01-01',
  weeklyPattern: ['Tatil', 'Sabah', 'Sabah', 'Sabah', 'Sabah', 'Tatil', 'Tatil'],
  customCycle: ['Tatil', 'Sabah', 'Sabah', 'Sabah', 'Sabah', 'Tatil', 'Tatil'],
  customHours: {
    Sabah: { start: '09:00', end: '18:00' },
    Akşam: { start: '16:00', end: '00:00' },
    Nöbet: { start: '14:00', end: '02:00' },
  },
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
