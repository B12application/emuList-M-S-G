// src/frontend/services/featureAccessService.ts
// Genel özellik erişim kontrol sistemi
// Admin, her kullanıcı için site özelliklerini açıp kapatabilir

import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../../backend/config/firebaseConfig';
import { isAdmin } from '../../backend/config/adminConfig';

/**
 * Kontrol edilebilir site özellikleri
 * Admin panelinden her kullanıcı için açılıp kapatılabilir
 */
export type FeatureKey =
  | 'notes'
  | 'planner'
  | 'expenses'
  | 'travelPlanner'
  | 'lists'
  | 'stats'
  | 'feed'
  | 'map'
  | 'myShows'
  | 'calorieAi';

export type FeatureAccessMap = Partial<Record<FeatureKey, boolean>>;

/**
 * Özellik varsayılan erişim durumları
 * calorieAi hariç tüm özellikler varsayılan olarak açık
 */
const DEFAULT_ACCESS: Record<FeatureKey, boolean> = {
  notes: true,
  planner: true,
  expenses: true,
  travelPlanner: true,
  lists: true,
  stats: true,
  feed: true,
  map: true,
  myShows: true,
  calorieAi: false, // Sadece admin açabilir
};

/**
 * Özellik etiketleri (Admin paneli için)
 */
export const FEATURE_LABELS: Record<FeatureKey, { tr: string; en: string; icon: string }> = {
  notes: { tr: 'Notlarım', en: 'Notes', icon: '📝' },
  planner: { tr: 'Takvim & Plan', en: 'Planner', icon: '📅' },
  expenses: { tr: 'Harcamalar', en: 'Expenses', icon: '💰' },
  travelPlanner: { tr: 'Gezi Planlayıcı', en: 'Travel Planner', icon: '🧭' },
  lists: { tr: 'Listelerim', en: 'Lists', icon: '📋' },
  stats: { tr: 'İstatistikler', en: 'Statistics', icon: '📊' },
  feed: { tr: 'Aktiviteler', en: 'Feed', icon: '📰' },
  map: { tr: 'Harita', en: 'Map', icon: '🗺️' },
  myShows: { tr: 'Dizi Takibi', en: 'My Shows', icon: '📺' },
  calorieAi: { tr: 'Kalori AI', en: 'Calorie AI', icon: '🔥' },
};

export const ALL_FEATURES: FeatureKey[] = Object.keys(DEFAULT_ACCESS) as FeatureKey[];

/**
 * Kullanıcının belirli bir özelliğe erişimi var mı kontrol eder
 */
export async function checkFeatureAccess(userId: string, feature: FeatureKey): Promise<boolean> {
  try {
    const userDoc = await getDoc(doc(db, 'users', userId));
    if (!userDoc.exists()) return DEFAULT_ACCESS[feature];

    const data = userDoc.data();
    const featureAccess = data.featureAccess as FeatureAccessMap | undefined;

    // featureAccess alanı yoksa varsayılanı kullan
    if (!featureAccess || featureAccess[feature] === undefined) {
      return DEFAULT_ACCESS[feature];
    }

    return featureAccess[feature]!;
  } catch (error) {
    console.error('Feature access check failed:', error);
    return DEFAULT_ACCESS[feature];
  }
}

/**
 * Kullanıcının tüm özellik erişimlerini getirir
 */
export async function getAllFeatureAccess(userId: string): Promise<Record<FeatureKey, boolean>> {
  try {
    const userDoc = await getDoc(doc(db, 'users', userId));
    if (!userDoc.exists()) return { ...DEFAULT_ACCESS };

    const data = userDoc.data();
    const featureAccess = data.featureAccess as FeatureAccessMap | undefined;

    // Varsayılanları kullanıcının ayarları ile birleştir
    const result = { ...DEFAULT_ACCESS };
    if (featureAccess) {
      for (const key of ALL_FEATURES) {
        if (featureAccess[key] !== undefined) {
          result[key] = featureAccess[key]!;
        }
      }
    }

    return result;
  } catch (error) {
    console.error('Feature access fetch failed:', error);
    return { ...DEFAULT_ACCESS };
  }
}

/**
 * Admin: Kullanıcının bir özelliğini açar/kapatır
 */
export async function setFeatureAccess(
  adminUserId: string,
  targetUserId: string,
  feature: FeatureKey,
  enabled: boolean
): Promise<boolean> {
  if (!isAdmin(adminUserId)) {
    throw new Error('Yetkisiz erişim');
  }

  try {
    await updateDoc(doc(db, 'users', targetUserId), {
      [`featureAccess.${feature}`]: enabled,
    });
    return true;
  } catch (error) {
    console.error('Feature access update failed:', error);
    return false;
  }
}

/**
 * Admin: Kullanıcının tüm özellik erişimlerini toplu günceller
 */
export async function setAllFeatureAccess(
  adminUserId: string,
  targetUserId: string,
  featureAccess: FeatureAccessMap
): Promise<boolean> {
  if (!isAdmin(adminUserId)) {
    throw new Error('Yetkisiz erişim');
  }

  try {
    await updateDoc(doc(db, 'users', targetUserId), {
      featureAccess,
    });
    return true;
  } catch (error) {
    console.error('Feature access bulk update failed:', error);
    return false;
  }
}
