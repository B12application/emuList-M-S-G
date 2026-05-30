import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { getUserShiftSettings, saveUserShiftSettings } from '../../backend/services/shiftService';
import {
  type ShiftSettings,
  type ShiftInfo,
  type ShiftType,
  getShiftInfo,
  DEFAULT_SHIFT_SETTINGS
} from '../utils/shiftLogic';
import { format, subDays, startOfWeek } from 'date-fns';

interface ShiftContextType {
  shiftSettings: ShiftSettings;
  loading: boolean;
  getShiftInfo: (date: Date, exactTime?: boolean) => ShiftInfo;
  updateSettings: (newSettings: Partial<ShiftSettings>) => Promise<void>;
  setDayOverride: (date: Date, type: ShiftType | 'default') => Promise<void>;
  realignCycle: (date: Date, type: 'Sabah' | 'Akşam' | 'Tatil' | 'Sabahçı' | 'Akşamcı') => Promise<void>;
}

const ShiftContext = createContext<ShiftContextType | undefined>(undefined);

export function ShiftProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [shiftSettings, setShiftSettings] = useState<ShiftSettings>(DEFAULT_SHIFT_SETTINGS);
  const [loading, setLoading] = useState(true);

  // Synchronously load from LocalStorage first to prevent flash of default values
  useEffect(() => {
    const userId = user ? user.uid : 'default';
    try {
      const cached = localStorage.getItem(`shift_settings_${userId}`);
      if (cached) {
        setShiftSettings({
          ...DEFAULT_SHIFT_SETTINGS,
          ...JSON.parse(cached)
        });
      } else {
        setShiftSettings(DEFAULT_SHIFT_SETTINGS);
      }
    } catch (e) {
      console.warn('Failed to load local shift settings on mount', e);
    }
  }, [user]);

  // Asynchronously fetch from Firestore
  useEffect(() => {
    async function loadDbSettings() {
      if (!user) {
        setLoading(false);
        return;
      }
      try {
        const dbSettings = await getUserShiftSettings(user.uid);
        setShiftSettings(dbSettings);
        localStorage.setItem(`shift_settings_${user.uid}`, JSON.stringify(dbSettings));
      } catch (err) {
        console.error('Failed to sync shift settings from db:', err);
      } finally {
        setLoading(false);
      }
    }
    loadDbSettings();
  }, [user]);

  // Core update helper
  const updateSettings = useCallback(async (newSettings: Partial<ShiftSettings>) => {
    const userId = user ? user.uid : 'default';
    setShiftSettings(prev => {
      const updated = {
        ...prev,
        ...newSettings,
        overrides: newSettings.overrides !== undefined ? newSettings.overrides : (prev.overrides || {})
      };

      // Update local storage
      try {
        localStorage.setItem(`shift_settings_${userId}`, JSON.stringify(updated));
      } catch (e) {
        console.warn('Failed to save shift settings to LocalStorage', e);
      }

      // Update Firestore in background
      if (user) {
        saveUserShiftSettings(user.uid, updated).catch(err => {
          console.error('Failed to save shift settings to Firestore', err);
        });
      }

      return updated;
    });
  }, [user]);

  // Set day overrides (set specific shift or remove by passing 'default')
  const setDayOverride = useCallback(async (date: Date, type: ShiftType | 'default') => {
    const dateStr = format(date, 'yyyy-MM-dd');
    const updatedOverrides = { ...(shiftSettings.overrides || {}) };

    if (type === 'default') {
      delete updatedOverrides[dateStr];
    } else {
      updatedOverrides[dateStr] = type;
    }

    await updateSettings({ overrides: updatedOverrides });
  }, [shiftSettings, updateSettings]);

  // Re-align the cycle from a specific date
  const realignCycle = useCallback(async (date: Date, type: 'Sabah' | 'Akşam' | 'Tatil' | 'Sabahçı' | 'Akşamcı') => {
    if (shiftSettings.planMode === '3-person') {
      const dateStr = format(date, 'yyyy-MM-dd');
      let newRefDate3 = dateStr;

      if (type === 'Sabah') {
        newRefDate3 = dateStr;
      } else if (type === 'Akşam') {
        newRefDate3 = format(subDays(date, 6), 'yyyy-MM-dd');
      } else if (type === 'Tatil') {
        newRefDate3 = format(subDays(date, 4), 'yyyy-MM-dd');
      }

      await updateSettings({ refDate3: newRefDate3 });
    } else {
      // 2-person plan mode: align the week
      const dateStr = format(date, 'yyyy-MM-dd');
      const monOfSelectedWeek = startOfWeek(date, { weekStartsOn: 1 });
      let newRefDate2 = format(monOfSelectedWeek, 'yyyy-MM-dd');

      if (type === 'Akşamcı') {
        newRefDate2 = format(subDays(monOfSelectedWeek, 7), 'yyyy-MM-dd');
      }

      await updateSettings({ refDate2: newRefDate2 });
    }
  }, [shiftSettings.planMode, updateSettings]);

  // Bound getShiftInfo
  const getShiftInfoBound = useCallback((date: Date, exactTime: boolean = false) => {
    return getShiftInfo(date, exactTime, shiftSettings);
  }, [shiftSettings]);

  const value = {
    shiftSettings,
    loading,
    getShiftInfo: getShiftInfoBound,
    updateSettings,
    setDayOverride,
    realignCycle
  };

  return (
    <ShiftContext.Provider value={value}>
      {children}
    </ShiftContext.Provider>
  );
}

export function useShift() {
  const context = useContext(ShiftContext);
  if (context === undefined) {
    throw new Error('useShift, ShiftProvider içinde kullanılmalıdır');
  }
  return context;
}
