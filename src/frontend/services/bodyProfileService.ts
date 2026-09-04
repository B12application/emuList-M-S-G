// src/frontend/services/bodyProfileService.ts
// Beden Profili & Kalori Açığı — Servis katmanı
// BMR (Mifflin-St Jeor), TDEE, BMI, Vücut Yağ Oranı (US Navy) hesaplamaları
// Firebase Firestore'da body_profiles/{userId} dokümanında saklanır

import {
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../../backend/config/firebaseConfig';

// ── Types ──────────────────────────────────────────────

export type Gender = 'male' | 'female';
export type ActivityLevel = 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';

export interface BodyMeasurements {
  neckCm: number;              // Boyun
  shoulderCm: number;          // Omuz
  chestCm: number;             // Göğüs
  waistCm: number;             // Bel
  upperArmLeftCm: number;      // Üst Kol (Sol)
  upperArmRightCm: number;     // Üst Kol (Sağ)
  forearmLeftCm: number;       // Alt Kol (Sol)
  forearmRightCm: number;      // Alt Kol (Sağ)
  upperAbdomenCm: number;      // Üst Karın
  lowerAbdomenCm: number;      // Alt Karın
  thighLeftCm: number;         // Uyluk (Sol)
  thighRightCm: number;        // Uyluk (Sağ)
  calfLeftCm: number;          // Baldır (Sol)
  calfRightCm: number;         // Baldır (Sağ)
  hipCm: number;               // Kalça

  // Geriye dönük uyumluluk alanları
  upperArmCm?: number;
  thighCm?: number;
  calfCm?: number;
}

export type ValidMeasurementKey = keyof Omit<BodyMeasurements, 'upperArmCm' | 'thighCm' | 'calfCm'>;

export interface MeasurementMeta {
  key: ValidMeasurementKey;
  label: string;
  emoji: string;
  category: 'upper' | 'arms' | 'core' | 'legs';
  categoryLabel: string;
  tip: string;
}

export const MEASUREMENT_LIST: MeasurementMeta[] = [
  { key: 'neckCm', label: 'Boyun', emoji: '🔵', category: 'upper', categoryLabel: 'Üst Beden', tip: 'Adem elmasının hemen altından mezurayı yatay tutarak ölçün.' },
  { key: 'shoulderCm', label: 'Omuz', emoji: '🥋', category: 'upper', categoryLabel: 'Üst Beden', tip: 'Omuz başlarının en dış noktalarından sırtı sararak ölçün.' },
  { key: 'chestCm', label: 'Göğüs', emoji: '🟣', category: 'upper', categoryLabel: 'Üst Beden', tip: 'Göğüs uçları hizasından, kollar serbestken nefes vermeden ölçün.' },
  { key: 'upperArmLeftCm', label: 'Üst Kol (Sol)', emoji: '💪', category: 'arms', categoryLabel: 'Kollar', tip: 'Sol pazının en şişkin noktasından ölçün.' },
  { key: 'upperArmRightCm', label: 'Üst Kol (Sağ)', emoji: '💪', category: 'arms', categoryLabel: 'Kollar', tip: 'Sağ pazının en şişkin noktasından ölçün.' },
  { key: 'forearmLeftCm', label: 'Alt Kol (Sol)', emoji: '🦾', category: 'arms', categoryLabel: 'Kollar', tip: 'Sol dirseğin yaklaşık 5 cm altından en kalın bölgeden ölçün.' },
  { key: 'forearmRightCm', label: 'Alt Kol (Sağ)', emoji: '🦾', category: 'arms', categoryLabel: 'Kollar', tip: 'Sağ dirseğin yaklaşık 5 cm altından en kalın bölgeden ölçün.' },
  { key: 'upperAbdomenCm', label: 'Üst Karın', emoji: '📐', category: 'core', categoryLabel: 'Karın, Bel & Kalça', tip: 'Göğüs kafesi ile göbek deliği arasındaki üst karından ölçün.' },
  { key: 'waistCm', label: 'Bel', emoji: '🟠', category: 'core', categoryLabel: 'Karın, Bel & Kalça', tip: 'Göbek deliğinin yaklaşık 2 cm üzerinden en dar kısımdan ölçün.' },
  { key: 'lowerAbdomenCm', label: 'Alt Karın', emoji: '📏', category: 'core', categoryLabel: 'Karın, Bel & Kalça', tip: 'Göbek deliğinin 3-4 cm altından alt karından ölçün.' },
  { key: 'hipCm', label: 'Kalça', emoji: '🔴', category: 'core', categoryLabel: 'Karın, Bel & Kalça', tip: 'Kalçanın arkadan en çıkıntılı ve geniş olduğu noktadan ölçün.' },
  { key: 'thighLeftCm', label: 'Uyluk (Sol)', emoji: '🦵', category: 'legs', categoryLabel: 'Bacaklar', tip: 'Sol bacağın kasığa en yakın, en kalın bölgesinden ölçün.' },
  { key: 'thighRightCm', label: 'Uyluk (Sağ)', emoji: '🦵', category: 'legs', categoryLabel: 'Bacaklar', tip: 'Sağ bacağın kasığa en yakın, en kalın bölgesinden ölçün.' },
  { key: 'calfLeftCm', label: 'Baldır (Sol)', emoji: '🟤', category: 'legs', categoryLabel: 'Bacaklar', tip: 'Sol baldırın en geniş noktasından ölçün.' },
  { key: 'calfRightCm', label: 'Baldır (Sağ)', emoji: '🟤', category: 'legs', categoryLabel: 'Bacaklar', tip: 'Sağ baldırın en geniş noktasından ölçün.' },
];

export const MEASUREMENT_LABELS: Record<ValidMeasurementKey, { label: string; emoji: string; tip: string }> =
  MEASUREMENT_LIST.reduce((acc, item) => {
    acc[item.key] = { label: item.label, emoji: item.emoji, tip: item.tip };
    return acc;
  }, {} as Record<ValidMeasurementKey, { label: string; emoji: string; tip: string }>);

export interface BodyProfile {
  userId: string;
  gender: Gender;
  age: number;
  heightCm: number;
  weightKg: number;
  targetWeightKg: number;
  activityLevel: ActivityLevel;
  measurements: BodyMeasurements;
  createdAt?: any;
  updatedAt?: any;
}

// ── Activity Multipliers ───────────────────────────────

const ACTIVITY_MULTIPLIERS: Record<ActivityLevel, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  very_active: 1.9,
};

export const ACTIVITY_LABELS: Record<ActivityLevel, string> = {
  sedentary: 'Hareketsiz (Masa başı)',
  light: 'Hafif Aktif (Haftada 1-3 gün)',
  moderate: 'Orta Aktif (Haftada 3-5 gün)',
  active: 'Aktif (Haftada 6-7 gün)',
  very_active: 'Çok Aktif (Günde 2x antrenman)',
};

// ── Calculation Functions ──────────────────────────────

/**
 * BMR hesapla — Mifflin-St Jeor formülü
 * Erkek: 10 × ağırlık(kg) + 6.25 × boy(cm) − 5 × yaş + 5
 * Kadın: 10 × ağırlık(kg) + 6.25 × boy(cm) − 5 × yaş − 161
 */
export function calculateBMR(
  gender: Gender,
  weightKg: number,
  heightCm: number,
  age: number
): number {
  const base = 10 * weightKg + 6.25 * heightCm - 5 * age;
  return Math.round(gender === 'male' ? base + 5 : base - 161);
}

/**
 * TDEE hesapla — BMR × aktivite çarpanı
 */
export function calculateTDEE(bmr: number, activityLevel: ActivityLevel): number {
  return Math.round(bmr * ACTIVITY_MULTIPLIERS[activityLevel]);
}

/**
 * BMI hesapla — kg / (boy_m)²
 */
export function calculateBMI(weightKg: number, heightCm: number): number {
  const heightM = heightCm / 100;
  return Math.round((weightKg / (heightM * heightM)) * 10) / 10;
}

/**
 * BMI kategorisi
 */
export function getBMICategory(bmi: number): {
  label: string;
  color: string;
  emoji: string;
} {
  if (bmi < 18.5) return { label: 'Zayıf', color: 'text-blue-500', emoji: '💙' };
  if (bmi < 25) return { label: 'Normal', color: 'text-emerald-500', emoji: '💚' };
  if (bmi < 30) return { label: 'Fazla Kilolu', color: 'text-amber-500', emoji: '🧡' };
  if (bmi < 35) return { label: 'Obez (Sınıf 1)', color: 'text-orange-500', emoji: '🔶' };
  if (bmi < 40) return { label: 'Obez (Sınıf 2)', color: 'text-red-500', emoji: '🔴' };
  return { label: 'Aşırı Obez', color: 'text-rose-600', emoji: '🚨' };
}

/**
 * Vücut yağ oranı — US Navy formülü
 * Erkek: 495 / (1.0324 − 0.19077 × log10(bel − boyun) + 0.15456 × log10(boy)) − 450
 * Kadın: 495 / (1.29579 − 0.35004 × log10(bel + kalça − boyun) + 0.22100 × log10(boy)) − 450
 */
export function calculateBodyFat(
  gender: Gender,
  waistCm: number,
  neckCm: number,
  heightCm: number,
  hipCm?: number
): number | null {
  if (!waistCm || !neckCm || !heightCm) return null;
  if (waistCm <= neckCm) return null;

  try {
    let bodyFat: number;

    if (gender === 'male') {
      bodyFat =
        495 /
          (1.0324 -
            0.19077 * Math.log10(waistCm - neckCm) +
            0.15456 * Math.log10(heightCm)) -
        450;
    } else {
      if (!hipCm) return null;
      bodyFat =
        495 /
          (1.29579 -
            0.35004 * Math.log10(waistCm + hipCm - neckCm) +
            0.221 * Math.log10(heightCm)) -
        450;
    }

    return Math.round(bodyFat * 10) / 10;
  } catch {
    return null;
  }
}

/**
 * Vücut yağ oranı kategorisi
 */
export function getBodyFatCategory(
  bodyFat: number,
  gender: Gender
): { label: string; color: string } {
  if (gender === 'male') {
    if (bodyFat < 6) return { label: 'Esansiyel Yağ', color: 'text-blue-500' };
    if (bodyFat < 14) return { label: 'Atletik', color: 'text-emerald-500' };
    if (bodyFat < 18) return { label: 'Fit', color: 'text-green-500' };
    if (bodyFat < 25) return { label: 'Ortalama', color: 'text-amber-500' };
    return { label: 'Yüksek', color: 'text-red-500' };
  } else {
    if (bodyFat < 14) return { label: 'Esansiyel Yağ', color: 'text-blue-500' };
    if (bodyFat < 21) return { label: 'Atletik', color: 'text-emerald-500' };
    if (bodyFat < 25) return { label: 'Fit', color: 'text-green-500' };
    if (bodyFat < 32) return { label: 'Ortalama', color: 'text-amber-500' };
    return { label: 'Yüksek', color: 'text-red-500' };
  }
}

/**
 * Kalori açığı hesapla
 * Güvenli aralık: günlük en fazla 750 kcal açık
 */
export function calculateCalorieDeficit(
  tdee: number,
  targetWeightKg: number,
  currentWeightKg: number
): {
  dailyCalorieTarget: number;
  dailyDeficit: number;
  weeklyWeightLossKg: number;
  weeksToGoal: number;
  isGaining: boolean;
} {
  const weightDiff = currentWeightKg - targetWeightKg;
  const isGaining = weightDiff < 0;

  if (Math.abs(weightDiff) < 0.5) {
    return {
      dailyCalorieTarget: tdee,
      dailyDeficit: 0,
      weeklyWeightLossKg: 0,
      weeksToGoal: 0,
      isGaining: false,
    };
  }

  let dailyDeficit = Math.min(Math.round(Math.abs(weightDiff) * 50), 750);
  let dailyCalorieTarget = isGaining ? tdee + dailyDeficit : tdee - dailyDeficit;
  if (dailyCalorieTarget < 1200) {
    dailyCalorieTarget = 1200;
    dailyDeficit = tdee - 1200;
  }

  // 1 kg yağ ≈ 7700 kcal
  const weeklyWeightLossKg = Math.round(((dailyDeficit * 7) / 7700) * 100) / 100;
  const weeksToGoal = weeklyWeightLossKg > 0
    ? Math.ceil(Math.abs(weightDiff) / weeklyWeightLossKg)
    : 0;

  return {
    dailyCalorieTarget,
    dailyDeficit,
    weeklyWeightLossKg,
    weeksToGoal,
    isGaining,
  };
}

/**
 * Spor Bilimi & Atletik İdeal Kilo Hesaplayıcı
 * Klasik WHO BMI alt sınırı (18.5) spor yapan veya normal kas kütlesine sahip bireylerde
 * aşırı kas kaybı ve sağlıksız zayıflık (ör. 175 cm için 57 kg gibi absürt sonuçlar) üretir.
 * Bu fonksiyon Devine formülü ve spor hekimliği (ACSM, FFMI) atletik vücut kompozisyonunu baz alır.
 */
export function getIdealWeightRange(heightCm: number, gender: Gender = 'male'): {
  min: number;
  max: number;
  athleticMin: number;
  athleticMax: number;
  muscularMin: number;
  muscularMax: number;
  devine: number;
  whoMin: number;
  whoMax: number;
  summary: string;
} {
  const heightM = heightCm / 100;
  const inches = heightCm / 2.54;
  const inchesOver5Ft = Math.max(0, inches - 60);

  // Devine Formülü (Tıp ve Spor Standardı)
  const devine = gender === 'male'
    ? Math.round((50 + 2.3 * inchesOver5Ft) * 10) / 10
    : Math.round((45.5 + 2.3 * inchesOver5Ft) * 10) / 10;

  // Atletik / Fit Aralık (%12-%15 yağ erkek, %20-%24 kadın)
  const athleticMin = gender === 'male'
    ? Math.round(23.0 * heightM * heightM)
    : Math.round(20.5 * heightM * heightM);

  const athleticMax = gender === 'male'
    ? Math.round(25.5 * heightM * heightM)
    : Math.round(23.8 * heightM * heightM);

  // Kaslı / Estetik Form (FFMI 22-24)
  const muscularMin = gender === 'male'
    ? Math.round(24.5 * heightM * heightM)
    : Math.round(22.0 * heightM * heightM);

  const muscularMax = gender === 'male'
    ? Math.round(27.0 * heightM * heightM)
    : Math.round(25.0 * heightM * heightM);

  const whoMin = Math.round(18.5 * heightM * heightM);
  const whoMax = Math.round(24.9 * heightM * heightM);

  return {
    min: athleticMin,
    max: athleticMax,
    athleticMin,
    athleticMax,
    muscularMin,
    muscularMax,
    devine,
    whoMin,
    whoMax,
    summary: `${athleticMin} - ${athleticMax} kg (Atletik Hedef)`,
  };
}

// ── Firebase CRUD ──────────────────────────────────────

const COLLECTION = 'body_profiles';

/**
 * Kullanıcının beden profilini kaydet (upsert)
 */
export async function saveBodyProfile(
  userId: string,
  data: Omit<BodyProfile, 'userId' | 'createdAt' | 'updatedAt'>
): Promise<void> {
  const profilePayload = {
    ...data,
    userId,
    updatedAt: serverTimestamp(),
  };

  let saved = false;

  // 1. users/{userId} dokümanına bodyProfile olarak kaydet (Canlıda kesinlikle izinlidir)
  try {
    const userDocRef = doc(db, 'users', userId);
    await setDoc(userDocRef, {
      bodyProfile: profilePayload,
    }, { merge: true });
    saved = true;
  } catch (userDocErr) {
    console.warn('users/{userId} bodyProfile yazımı başarısız:', userDocErr);
  }

  // 2. body_profiles/{userId} koleksiyonuna da kaydetmeyi dene
  try {
    const docRef = doc(db, COLLECTION, userId);
    await setDoc(docRef, profilePayload, { merge: true });
    saved = true;
  } catch (bodyProfilesErr) {
    // Güvenlik kuralları canlı Firebase Console'a henüz deploy edilmediyse normaldir
    if (!saved) {
      throw bodyProfilesErr;
    }
  }
}

/**
 * Kullanıcının beden profilini getir
 * Önce users/{userId} altındaki bodyProfile'a, ardından body_profiles/{userId}'ye bakar
 */
export async function getBodyProfile(userId: string): Promise<BodyProfile | null> {
  let profileData: any = null;

  // 1. users/{userId} dokümanından dene
  try {
    const userDocRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userDocRef);
    if (userSnap.exists() && userSnap.data()?.bodyProfile) {
      profileData = userSnap.data().bodyProfile;
    }
  } catch (err) {
    console.warn('users/{userId} bodyProfile okunamadı:', err);
  }

  // 2. Eğer bulunamadıysa body_profiles/{userId}'den dene
  if (!profileData) {
    try {
      const docRef = doc(db, COLLECTION, userId);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        profileData = docSnap.data();
      }
    } catch (err) {
      console.warn('body_profiles/{userId} okunamadı:', err);
    }
  }

  if (!profileData) return null;

  const rawMeasurements = (profileData.measurements || {}) as any;

  // Tüm 15 alanın varlığını garanti et ve geriye dönük eski alanları aktar
  const fullMeasurements: BodyMeasurements = {
    neckCm: rawMeasurements.neckCm || 0,
    shoulderCm: rawMeasurements.shoulderCm || 0,
    chestCm: rawMeasurements.chestCm || 0,
    waistCm: rawMeasurements.waistCm || 0,
    upperArmLeftCm: rawMeasurements.upperArmLeftCm || rawMeasurements.upperArmCm || 0,
    upperArmRightCm: rawMeasurements.upperArmRightCm || rawMeasurements.upperArmCm || 0,
    forearmLeftCm: rawMeasurements.forearmLeftCm || 0,
    forearmRightCm: rawMeasurements.forearmRightCm || 0,
    upperAbdomenCm: rawMeasurements.upperAbdomenCm || 0,
    lowerAbdomenCm: rawMeasurements.lowerAbdomenCm || 0,
    thighLeftCm: rawMeasurements.thighLeftCm || rawMeasurements.thighCm || 0,
    thighRightCm: rawMeasurements.thighRightCm || rawMeasurements.thighCm || 0,
    calfLeftCm: rawMeasurements.calfLeftCm || rawMeasurements.calfCm || 0,
    calfRightCm: rawMeasurements.calfRightCm || rawMeasurements.calfCm || 0,
    hipCm: rawMeasurements.hipCm || 0,
  };

  return {
    ...profileData,
    measurements: fullMeasurements,
  };
}

// ── Helpers ────────────────────────────────────────────

/**
 * Boş ölçüm nesnesi üret (15 bölge)
 */
export function emptyMeasurements(): BodyMeasurements {
  return {
    neckCm: 0,
    shoulderCm: 0,
    chestCm: 0,
    waistCm: 0,
    upperArmLeftCm: 0,
    upperArmRightCm: 0,
    forearmLeftCm: 0,
    forearmRightCm: 0,
    upperAbdomenCm: 0,
    lowerAbdomenCm: 0,
    thighLeftCm: 0,
    thighRightCm: 0,
    calfLeftCm: 0,
    calfRightCm: 0,
    hipCm: 0,
  };
}

/**
 * Varsayılan profil üret
 */
export function defaultBodyProfile(userId: string): Omit<BodyProfile, 'createdAt' | 'updatedAt'> {
  return {
    userId,
    gender: 'male',
    age: 25,
    heightCm: 175,
    weightKg: 75,
    targetWeightKg: 70,
    activityLevel: 'moderate',
    measurements: emptyMeasurements(),
  };
}
