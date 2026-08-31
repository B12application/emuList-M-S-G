// src/frontend/services/calorieLimitService.ts
// Kalori AI günlük kullanım limiti takip servisi
// Varsayılan: 50 analiz / gün, her gün 00:00'da otomatik sıfırlanır.

import { useState, useEffect, useCallback } from 'react';
import { doc, getDoc, updateDoc, setDoc, onSnapshot, Timestamp } from 'firebase/firestore';
import { db } from '../../backend/config/firebaseConfig';

export const DEFAULT_DAILY_LIMIT = 50;

export interface CalorieAiUsageInfo {
  date: string; // YYYY-MM-DD
  usedToday: number;
  dailyLimit: number;
  remainingToday: number;
  percentageUsed: number;
  isLimitReached: boolean;
  resetsAt: string;
}

/**
 * Bugünün tarih anahtarını döndürür (YYYY-MM-DD)
 */
export function getTodayDateKey(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Yerel fallback için localStorage anahtarı
 */
function getLocalKey(userId: string, dateKey: string): string {
  return `calorie_ai_usage_${userId}_${dateKey}`;
}

/**
 * Ham kullanım verisinden kullanıcı dostu kota nesnesi oluşturur
 */
export function computeUsageInfo(
  dateKey: string,
  count: number,
  customLimit?: number
): CalorieAiUsageInfo {
  const todayKey = getTodayDateKey();
  const isToday = dateKey === todayKey;
  const usedToday = isToday ? Math.max(0, count) : 0;
  const dailyLimit = customLimit && customLimit > 0 ? customLimit : DEFAULT_DAILY_LIMIT;
  const remainingToday = Math.max(0, dailyLimit - usedToday);
  const percentageUsed = Math.min(100, Math.round((usedToday / dailyLimit) * 100));

  return {
    date: todayKey,
    usedToday,
    dailyLimit,
    remainingToday,
    percentageUsed,
    isLimitReached: remainingToday <= 0,
    resetsAt: '00:00',
  };
}

/**
 * Kullanıcının bugünkü AI kullanım durumunu Firestore ve yerel depolamadan getirir
 */
export async function getCalorieAiUsage(userId: string): Promise<CalorieAiUsageInfo> {
  const todayKey = getTodayDateKey();
  try {
    const userDocRef = doc(db, 'users', userId);
    const snap = await getDoc(userDocRef);

    if (snap.exists()) {
      const data = snap.data();
      const usage = data.calorieAiUsage;
      const customLimit = usage?.customLimit || data.calorieAiCustomLimit;

      if (usage && usage.date === todayKey) {
        const count = typeof usage.count === 'number' ? usage.count : 0;
        return computeUsageInfo(todayKey, count, customLimit);
      } else {
        // Yeni gün veya ilk kullanım
        return computeUsageInfo(todayKey, 0, customLimit);
      }
    }
  } catch (error) {
    console.warn('Firestore kullanım limiti okunamadı, yerel depolama deneniyor:', error);
  }

  // Fallback to localStorage
  try {
    const saved = localStorage.getItem(getLocalKey(userId, todayKey));
    const count = saved ? parseInt(saved, 10) : 0;
    return computeUsageInfo(todayKey, isNaN(count) ? 0 : count);
  } catch {
    return computeUsageInfo(todayKey, 0);
  }
}

/**
 * Başarılı bir AI analiz sorgusunun ardından sayacı 1 artırır
 */
export async function incrementCalorieAiUsage(userId: string): Promise<CalorieAiUsageInfo> {
  const todayKey = getTodayDateKey();
  let newCount = 1;
  let customLimit: number | undefined;

  try {
    const userDocRef = doc(db, 'users', userId);
    const snap = await getDoc(userDocRef);

    if (snap.exists()) {
      const data = snap.data();
      const usage = data.calorieAiUsage;
      customLimit = usage?.customLimit || data.calorieAiCustomLimit;

      if (usage && usage.date === todayKey) {
        newCount = (typeof usage.count === 'number' ? usage.count : 0) + 1;
      }

      await updateDoc(userDocRef, {
        'calorieAiUsage.date': todayKey,
        'calorieAiUsage.count': newCount,
        'calorieAiUsage.updatedAt': Timestamp.now(),
      });
    } else {
      await setDoc(
        userDocRef,
        {
          calorieAiUsage: {
            date: todayKey,
            count: 1,
            updatedAt: Timestamp.now(),
          },
        },
        { merge: true }
      );
    }
  } catch (error) {
    console.warn('Firestore kullanım limiti güncellenemedi, yerel depolama güncelleniyor:', error);
    try {
      const saved = localStorage.getItem(getLocalKey(userId, todayKey));
      const current = saved ? parseInt(saved, 10) : 0;
      newCount = (isNaN(current) ? 0 : current) + 1;
    } catch {}
  }

  // Always sync to local storage as fallback
  try {
    localStorage.setItem(getLocalKey(userId, todayKey), String(newCount));
  } catch {}

  return computeUsageInfo(todayKey, newCount, customLimit);
}

/**
 * React hook: Kullanıcının kullanım kotasını anlık ve gerçek zamanlı takip eder
 */
export function useCalorieAiUsage(userId?: string) {
  const todayKey = getTodayDateKey();
  const [usage, setUsage] = useState<CalorieAiUsageInfo>(() => computeUsageInfo(todayKey, 0));
  const [loading, setLoading] = useState<boolean>(true);

  const refreshUsage = useCallback(async () => {
    if (!userId) return;
    const current = await getCalorieAiUsage(userId);
    setUsage(current);
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    if (!userId) {
      setUsage(computeUsageInfo(todayKey, 0));
      setLoading(false);
      return;
    }

    setLoading(true);

    // Initial fetch from local or memory
    getCalorieAiUsage(userId).then(info => {
      setUsage(info);
      setLoading(false);
    });

    // Subscribe to real-time changes
    const userDocRef = doc(db, 'users', userId);
    const unsubscribe = onSnapshot(
      userDocRef,
      (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          const usageData = data.calorieAiUsage;
          const customLimit = usageData?.customLimit || data.calorieAiCustomLimit;
          const count = usageData?.date === todayKey ? (usageData.count || 0) : 0;
          setUsage(computeUsageInfo(todayKey, count, customLimit));
        }
        setLoading(false);
      },
      (err) => {
        console.warn('Realtime usage snapshot error:', err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [userId, todayKey]);

  return { usage, loading, refreshUsage };
}
