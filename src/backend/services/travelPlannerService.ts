import { db, storage } from '../config/firebaseConfig';
import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import type { TravelPlan, VisitedPlace } from '../types/travelPlanner';

// Helper to recursively remove undefined values before writing to Firestore
function removeUndefined<T extends Record<string, any>>(obj: T): T {
  const cleaned: any = {};
  Object.keys(obj).forEach((key) => {
    const val = obj[key];
    if (val !== undefined) {
      if (Array.isArray(val)) {
        cleaned[key] = val.map((item) =>
          item && typeof item === 'object' && !(item instanceof Date) ? removeUndefined(item) : item
        );
      } else if (val && typeof val === 'object' && !(val instanceof Date) && typeof val.toDate !== 'function') {
        cleaned[key] = removeUndefined(val);
      } else {
        cleaned[key] = val;
      }
    }
  });
  return cleaned;
}

// ===================== TRAVEL PLANS =====================

/**
 * Save or update a travel plan
 */
export async function saveTravelPlan(userId: string, plan: Omit<TravelPlan, 'id' | 'createdAt' | 'userId'>): Promise<string> {
  const planRef = doc(collection(db, 'users', userId, 'travelPlans'));
  const rawData = {
    ...plan,
    id: planRef.id,
    userId,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  const planData = removeUndefined(rawData);
  await setDoc(planRef, planData);
  return planRef.id;
}

/**
 * Update an existing travel plan
 */
export async function updateTravelPlan(userId: string, planId: string, updates: Partial<TravelPlan>): Promise<void> {
  const planRef = doc(db, 'users', userId, 'travelPlans', planId);
  const cleanUpdates = removeUndefined({
    ...updates,
    updatedAt: serverTimestamp(),
  });
  await updateDoc(planRef, cleanUpdates);
}

/**
 * Get all travel plans for a user, optionally filtered by city
 */
export async function getUserPlans(userId: string, cityId?: string): Promise<TravelPlan[]> {
  const plansRef = collection(db, 'users', userId, 'travelPlans');
  
  let q;
  if (cityId) {
    q = query(plansRef, where('cityId', '==', cityId), orderBy('createdAt', 'desc'));
  } else {
    q = query(plansRef, orderBy('createdAt', 'desc'));
  }

  const snapshot = await getDocs(q);
  return snapshot.docs.map(d => ({ ...d.data(), id: d.id } as TravelPlan));
}

/**
 * Get a single travel plan
 */
export async function getTravelPlan(userId: string, planId: string): Promise<TravelPlan | null> {
  const planRef = doc(db, 'users', userId, 'travelPlans', planId);
  const snap = await getDoc(planRef);
  return snap.exists() ? ({ ...snap.data(), id: snap.id } as TravelPlan) : null;
}

/**
 * Delete a travel plan
 */
export async function deleteTravelPlan(userId: string, planId: string): Promise<void> {
  await deleteDoc(doc(db, 'users', userId, 'travelPlans', planId));
}

/**
 * Update plan status
 */
export async function updatePlanStatus(userId: string, planId: string, status: TravelPlan['status']): Promise<void> {
  await updateTravelPlan(userId, planId, { status });
}

/**
 * Toggle a stop's visited status within a plan
 */
export async function toggleStopVisited(userId: string, planId: string, stopOrder: number, visited: boolean): Promise<void> {
  const plan = await getTravelPlan(userId, planId);
  if (!plan) return;

  const updatedStops = plan.stops.map(s =>
    s.order === stopOrder ? { ...s, visited } : s
  );

  await updateTravelPlan(userId, planId, { stops: updatedStops });
}

// ===================== VISITED PLACES =====================

/**
 * Save a visited place
 */
export async function saveVisitedPlace(userId: string, place: Omit<VisitedPlace, 'id'>): Promise<string> {
  const placeRef = doc(collection(db, 'users', userId, 'visitedPlaces'));
  const placeData = removeUndefined({
    ...place,
    id: placeRef.id,
  });

  await setDoc(placeRef, placeData);
  return placeRef.id;
}

/**
 * Get all visited places, optionally filtered by city
 */
export async function getVisitedPlaces(userId: string, cityId?: string): Promise<VisitedPlace[]> {
  const placesRef = collection(db, 'users', userId, 'visitedPlaces');

  let q;
  if (cityId) {
    q = query(placesRef, where('cityId', '==', cityId));
  } else {
    q = query(placesRef);
  }

  const snapshot = await getDocs(q);
  return snapshot.docs.map(d => ({ ...d.data(), id: d.id } as VisitedPlace));
}

/**
 * Check if a place is visited
 */
export async function isPlaceVisited(userId: string, attractionXid: string): Promise<boolean> {
  const placesRef = collection(db, 'users', userId, 'visitedPlaces');
  const q = query(placesRef, where('attractionXid', '==', attractionXid));
  const snapshot = await getDocs(q);
  return !snapshot.empty;
}

/**
 * Delete a visited place
 */
export async function deleteVisitedPlace(userId: string, placeId: string): Promise<void> {
  await deleteDoc(doc(db, 'users', userId, 'visitedPlaces', placeId));
}

/**
 * Update a visited place (notes, rating, etc.)
 */
export async function updateVisitedPlace(userId: string, placeId: string, updates: Partial<VisitedPlace>): Promise<void> {
  const placeRef = doc(db, 'users', userId, 'visitedPlaces', placeId);
  await updateDoc(placeRef, updates);
}

// ===================== PHOTOS =====================

/**
 * Upload a travel photo to Firebase Storage
 */
export async function uploadTravelPhoto(
  userId: string,
  placeId: string,
  file: File
): Promise<string> {
  const fileExt = file.name.split('.').pop();
  const fileName = `${Date.now()}_${Math.random().toString(36).slice(2)}.${fileExt}`;
  const storageRef = ref(storage, `travelPhotos/${userId}/${placeId}/${fileName}`);

  await uploadBytes(storageRef, file);
  const url = await getDownloadURL(storageRef);
  return url;
}

/**
 * Delete a travel photo from Firebase Storage
 */
export async function deleteTravelPhoto(photoUrl: string): Promise<void> {
  try {
    const storageRef = ref(storage, photoUrl);
    await deleteObject(storageRef);
  } catch (error) {
    console.error('Error deleting photo:', error);
  }
}

// ===================== STATS =====================

/**
 * Get city-level stats for the user
 */
export async function getCityStats(userId: string) {
  const visitedPlaces = await getVisitedPlaces(userId);
  const plans = await getUserPlans(userId);

  // Group by city
  const cityMap = new Map<string, { visited: number; planned: number; cityName: string }>();

  for (const place of visitedPlaces) {
    const existing = cityMap.get(place.cityId) || { visited: 0, planned: 0, cityName: place.cityName };
    existing.visited++;
    cityMap.set(place.cityId, existing);
  }

  for (const plan of plans) {
    const existing = cityMap.get(plan.cityId) || { visited: 0, planned: 0, cityName: plan.cityName };
    existing.planned += plan.stops.length;
    cityMap.set(plan.cityId, existing);
  }

  return cityMap;
}
