import type { TouristAttraction, AttractionDetail } from '../../backend/types/travelPlanner';
import { db } from '../../backend/config/firebaseConfig';
import { doc, getDoc, setDoc } from 'firebase/firestore';

const API_KEY = import.meta.env.VITE_OPENTRIPMAP_API_KEY;
const BASE_URL = 'https://api.opentripmap.com/0.1/en/places';

import type { CityDistrict } from '../data/turkeyDistricts';

// Local cache to avoid re-fetching
const attractionCache = new Map<string, TouristAttraction[]>();
const detailCache = new Map<string, AttractionDetail>();

/**
 * Fetch tourist attractions dynamically for a specific district using OpenTripMap API
 * Uses 3-layer persistent cache (Memory -> LocalStorage -> Firestore)
 */
export async function fetchAttractionsByDistrict(
  district: CityDistrict,
  cityId: string,
  kinds?: string
): Promise<TouristAttraction[]> {
  const cacheKey = `dist_${district.id}_${kinds || 'all'}`;
  const localCacheKey = `travel_district_${cacheKey}`;

  // Helper to deduplicate items by name or xid
  const deduplicate = (list: TouristAttraction[]) => {
    const seenNames = new Set<string>();
    const seenXids = new Set<string>();
    return list.filter(item => {
      const normName = (item.name || '').toLowerCase().trim();
      if (!normName || seenNames.has(normName) || (item.xid && seenXids.has(item.xid))) {
        return false;
      }
      seenNames.add(normName);
      if (item.xid) seenXids.add(item.xid);
      return true;
    });
  };

  // 1. Check memory cache
  if (attractionCache.has(cacheKey)) {
    return attractionCache.get(cacheKey)!;
  }

  // 2. Check localStorage cache
  try {
    const cached = localStorage.getItem(localCacheKey);
    if (cached) {
      const parsed = JSON.parse(cached);
      if (parsed.timestamp && Date.now() - parsed.timestamp < 30 * 24 * 60 * 60 * 1000 && Array.isArray(parsed.data)) {
        const validData = parsed.data
          .map((a: any) => ({
            ...a,
            lat: Number(a.lat ?? a.point?.lat),
            lon: Number(a.lon ?? a.point?.lon),
          }))
          .filter((a: any) => Boolean(a.name && !isNaN(a.lat) && !isNaN(a.lon) && a.lat !== 0 && a.lon !== 0));

        if (validData.length > 0) {
          const deduped = deduplicate(validData);
          attractionCache.set(cacheKey, deduped);
          return deduped;
        }
      }
    }
  } catch { /* ignore parse errors */ }

  // 3. Check Firestore persistent cache
  try {
    const firestoreRef = doc(db, 'districtAttractions', district.id);
    const snap = await getDoc(firestoreRef);
    if (snap.exists()) {
      const data = snap.data();
      if (Array.isArray(data.items) && data.items.length > 0) {
        const validData: TouristAttraction[] = data.items
          .map((a: any) => ({
            ...a,
            lat: Number(a.lat ?? a.point?.lat),
            lon: Number(a.lon ?? a.point?.lon),
          }))
          .filter((a: any) => Boolean(a.name && !isNaN(a.lat) && !isNaN(a.lon)));

        if (validData.length > 0) {
          const deduped = deduplicate(validData);
          attractionCache.set(cacheKey, deduped);
          try {
            localStorage.setItem(localCacheKey, JSON.stringify({ data: deduped, timestamp: Date.now() }));
          } catch {}
          return deduped;
        }
      }
    }
  } catch { /* ignore firestore error */ }

  // 4. Fetch directly from OpenTripMap API for district coordinates
  try {
    const searchRadius = district.radius || 20000;
    const params = new URLSearchParams({
      radius: searchRadius.toString(),
      lon: district.lon.toString(),
      lat: district.lat.toString(),
      apikey: API_KEY,
      limit: '500',
      format: 'json',
    });

    if (kinds) {
      params.set('kinds', kinds);
    }

    const response = await fetch(`${BASE_URL}/radius?${params}`);
    if (!response.ok) {
      throw new Error(`OpenTripMap district error: ${response.status}`);
    }

    const rawData: any[] = await response.json();
    
    // Normalize lat/lon & filter valid coordinates
    const filtered: TouristAttraction[] = rawData
      .map((a: any) => ({
        ...a,
        lat: Number(a.lat ?? a.point?.lat),
        lon: Number(a.lon ?? a.point?.lon),
      }))
      .filter((a: TouristAttraction) =>
        Boolean(a.name && a.name.trim().length > 0 && !isNaN(a.lat) && !isNaN(a.lon) && a.lat !== 0 && a.lon !== 0)
      )
      .sort((a, b) => (b.rate || 0) - (a.rate || 0));

    const finalMerged = deduplicate(filtered);

    // Save to memory, localStorage, and Firestore cache
    attractionCache.set(cacheKey, finalMerged);
    try {
      localStorage.setItem(localCacheKey, JSON.stringify({
        data: finalMerged,
        timestamp: Date.now()
      }));
    } catch {}

    try {
      setDoc(doc(db, 'districtAttractions', district.id), {
        districtName: district.name,
        cityId,
        items: finalMerged.slice(0, 500),
        updatedAt: new Date().toISOString(),
      });
    } catch {}

    return finalMerged;
  } catch (error) {
    console.error(`Error fetching attractions for district ${district.name}:`, error);
    return [];
  }
}

/**
 * Fetch tourist attractions near a city center and all its districts
 */
export async function fetchAttractionsByCity(
  cityName: string,
  lat: number,
  lon: number,
  radius: number = 200000,
  kinds?: string,
  cityId?: string
): Promise<TouristAttraction[]> {
  const targetCityId = (cityId || cityName).toUpperCase();
  const cacheKey = `city_${targetCityId}_${radius}_${kinds || 'all'}`;

  if (attractionCache.has(cacheKey)) {
    return attractionCache.get(cacheKey)!;
  }

  // Fetch using city center coordinates directly
  try {
    const params = new URLSearchParams({
      radius: radius.toString(),
      lon: lon.toString(),
      lat: lat.toString(),
      apikey: API_KEY,
      limit: '500',
      format: 'json',
    });

    if (kinds) {
      params.set('kinds', kinds);
    }

    const response = await fetch(`${BASE_URL}/radius?${params}`);
    if (!response.ok) {
      throw new Error(`OpenTripMap API error: ${response.status}`);
    }

    const rawData: any[] = await response.json();
    const filtered: TouristAttraction[] = rawData
      .map((a: any) => ({
        ...a,
        lat: Number(a.lat ?? a.point?.lat),
        lon: Number(a.lon ?? a.point?.lon),
      }))
      .filter((a: TouristAttraction) =>
        Boolean(a.name && a.name.trim().length > 0 && !isNaN(a.lat) && !isNaN(a.lon) && a.lat !== 0 && a.lon !== 0)
      )
      .sort((a, b) => (b.rate || 0) - (a.rate || 0));

    attractionCache.set(cacheKey, filtered);
    return filtered;
  } catch (error) {
    console.error('Error fetching city attractions:', error);
    return [];
  }
}

/**
 * Fetch detailed info for a specific attraction
 */
export async function fetchAttractionDetail(xid: string): Promise<AttractionDetail | null> {
  // Check cache
  if (detailCache.has(xid)) {
    return detailCache.get(xid)!;
  }

  try {
    const response = await fetch(`${BASE_URL}/xid/${xid}?apikey=${API_KEY}`);
    
    if (!response.ok) {
      throw new Error(`OpenTripMap detail error: ${response.status}`);
    }

    const data: AttractionDetail = await response.json();
    detailCache.set(xid, data);
    return data;
  } catch (error) {
    console.error('Error fetching attraction detail:', error);
    return null;
  }
}

/**
 * Map OpenTripMap kinds to user-friendly categories
 */
export const ATTRACTION_CATEGORIES = [
  {
    key: 'cultural',
    label: 'Kültürel',
    icon: '🏛️',
    color: '#8b5cf6',
    kinds: ['cultural', 'theatres_and_entertainments', 'urban_environment']
  },
  {
    key: 'natural',
    label: 'Doğa',
    icon: '🌿',
    color: '#10b981',
    kinds: ['natural', 'geology', 'water', 'beaches']
  },
  {
    key: 'historic',
    label: 'Tarihi',
    icon: '🏰',
    color: '#f59e0b',
    kinds: ['historic', 'architecture', 'fortifications']
  },
  {
    key: 'museums',
    label: 'Müzeler',
    icon: '🖼️',
    color: '#3b82f6',
    kinds: ['museums']
  },
  {
    key: 'religion',
    label: 'Dini',
    icon: '🕌',
    color: '#06b6d4',
    kinds: ['religion']
  },
  {
    key: 'nature_reserves',
    label: 'Doğa Parkları',
    icon: '🌲',
    color: '#059669',
    kinds: ['nature_reserves', 'national_parks']
  },
  {
    key: 'amusements',
    label: 'Eğlence',
    icon: '🎢',
    color: '#ec4899',
    kinds: ['amusements', 'sport', 'shops']
  },
  {
    key: 'foods',
    label: 'Yemek',
    icon: '🍽️',
    color: '#ef4444',
    kinds: ['foods', 'restaurants']
  },
];

/**
 * Get category info for an attraction based on its kinds string
 */
export function getAttractionCategory(kinds: string) {
  const kindsList = kinds.toLowerCase().split(',').map(k => k.trim());
  
  for (const cat of ATTRACTION_CATEGORIES) {
    if (cat.kinds.some(k => kindsList.some(ak => ak.includes(k)))) {
      return cat;
    }
  }
  
  return {
    key: 'other',
    label: 'Diğer',
    icon: '📍',
    color: '#6b7280',
    kinds: []
  };
}

/**
 * Clear cached data for a city
 */
export function clearCityCache(cityName: string) {
  // Clear memory cache
  for (const key of attractionCache.keys()) {
    if (key.startsWith(cityName)) {
      attractionCache.delete(key);
    }
  }
  
  // Clear localStorage cache
  for (let i = localStorage.length - 1; i >= 0; i--) {
    const key = localStorage.key(i);
    if (key?.startsWith(`travel_attractions_${cityName}`)) {
      localStorage.removeItem(key);
    }
  }
}
