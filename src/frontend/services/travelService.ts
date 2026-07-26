import type { TouristAttraction, AttractionDetail } from '../../backend/types/travelPlanner';
import { db } from '../../backend/config/firebaseConfig';
import { doc, getDoc, setDoc } from 'firebase/firestore';

const API_KEY = import.meta.env.VITE_OPENTRIPMAP_API_KEY;
const BASE_URL = 'https://api.opentripmap.com/0.1/en/places';

// Local cache to avoid re-fetching
const attractionCache = new Map<string, TouristAttraction[]>();
const detailCache = new Map<string, AttractionDetail>();

// Curated famous landmarks for Turkish cities to guarantee iconic natural & historical spots
export const FAMOUS_TURKEY_LANDMARKS: Record<string, TouristAttraction[]> = {
  "TR38": [ // Kayseri
    { xid: "famous_kapuzbasi", name: "Kapuzbaşı Şelaleleri", lat: 37.7783, lon: 35.3933, kinds: "natural,waterfalls,water", rate: 3 },
    { xid: "famous_kultepe", name: "Kültepe Kaniş Karum Ören Yeri", lat: 38.8514, lon: 35.6358, kinds: "historic,archeological_sites", rate: 3 },
    { xid: "famous_erciyes", name: "Erciyes Dağı & Kayak Merkezi", lat: 38.5372, lon: 35.5342, kinds: "natural,sport,mountains", rate: 3 },
    { xid: "famous_sultan_sazligi", name: "Sultan Sazlığı Milli Parkı", lat: 38.3333, lon: 35.2500, kinds: "natural,national_parks", rate: 3 },
    { xid: "famous_soganli", name: "Soğanlı Vadisi & Kaya Kiliseleri", lat: 38.3414, lon: 34.9744, kinds: "historic,cultural,caves", rate: 3 },
    { xid: "famous_kayseri_kalesi", name: "Kayseri Kalesi & Tarihi Çarşı", lat: 38.7225, lon: 35.4881, kinds: "historic,architecture", rate: 3 },
    { xid: "famous_hunat_hatun", name: "Hunat Hatun Külliyesi & Camii", lat: 38.7208, lon: 35.4897, kinds: "historic,religion,cultural", rate: 3 },
    { xid: "famous_doner_kumbet", name: "Döner Kümbet", lat: 38.7186, lon: 35.4950, kinds: "historic,monuments", rate: 3 },
    { xid: "famous_yamula", name: "Yamula Barajı & Kuş Cenneti", lat: 38.9056, lon: 35.2444, kinds: "natural,water", rate: 3 },
    { xid: "famous_ali_dagi", name: "Ali Dağı Yürüyüş & Yamaç Paraşütü", lat: 38.6833, lon: 35.5333, kinds: "natural,sport", rate: 3 },
    { xid: "famous_derebag_selalesi", name: "Derebağ Şelalesi (Yahyalı)", lat: 37.9542, lon: 35.3489, kinds: "natural,waterfalls,water", rate: 3 },
    { xid: "famous_koramaz_vadisi", name: "Koramaz Vadisi & Ağırnas", lat: 38.7833, lon: 35.6667, kinds: "natural,historic,cultural", rate: 3 },
    { xid: "famous_mimarsinan_evi", name: "Mimar Sinan Evi (Ağırnas)", lat: 38.7886, lon: 35.6703, kinds: "historic,museums", rate: 3 },
  ],
  "TR58": [ // Sivas
    { xid: "famous_divrigi_ulucamii", name: "Divriği Ulu Camii ve Darüşşifası (UNESCO)", lat: 39.3733, lon: 38.1147, kinds: "historic,architecture,religion", rate: 3 },
    { xid: "famous_gok_medrese", name: "Gök Medrese (Sivas Merkez)", lat: 39.7436, lon: 37.0131, kinds: "historic,architecture", rate: 3 },
    { xid: "famous_cifte_minare", name: "Çifte Minareli Medrese", lat: 39.7483, lon: 37.0153, kinds: "historic,architecture", rate: 3 },
    { xid: "famous_sizir_selalesi", name: "Sızır Şelalesi (Gemerek)", lat: 39.3403, lon: 35.9619, kinds: "natural,waterfalls,water", rate: 3 },
    { xid: "famous_kangal_kaplica", name: "Kangal Balıklı Kaplıcası", lat: 39.2319, lon: 37.4786, kinds: "natural,baths", rate: 3 },
    { xid: "famous_todurge_golu", name: "Tödürge Gölü", lat: 39.8719, lon: 37.6042, kinds: "natural,water", rate: 3 },
    { xid: "famous_sivas_kongre_binasi", name: "Atatürk Kongre ve Etnografya Müzesi", lat: 39.7489, lon: 37.0142, kinds: "historic,museums", rate: 3 },
  ],
};

/**
 * Fetch tourist attractions near a city center
 * Uses 3-layer persistent cache (Memory -> LocalStorage -> Firestore)
 * OpenTripMap API is ONLY queried if not cached anywhere (Redis-like cache)
 */
export async function fetchAttractionsByCity(
  cityName: string,
  lat: number,
  lon: number,
  radius: number = 200000,
  kinds?: string,
  cityId?: string
): Promise<TouristAttraction[]> {
  const cacheKey = `${cityName}_${radius}_${kinds || 'all'}`;
  const targetCityId = cityId || cityName.toLowerCase();
  const famous = (cityId && FAMOUS_TURKEY_LANDMARKS[cityId]) || [];
  
  // Helper to merge famous landmarks with API list without duplicates
  const mergeAttractions = (apiList: TouristAttraction[]) => {
    const existingNames = new Set(apiList.map(a => a.name.toLowerCase()));
    const missingFamous = famous.filter(f => !existingNames.has(f.name.toLowerCase()));
    return [...missingFamous, ...apiList];
  };

  // 1. Check memory cache
  if (attractionCache.has(cacheKey)) {
    return mergeAttractions(attractionCache.get(cacheKey)!);
  }

  // 2. Check localStorage cache
  const localCacheKey = `travel_attractions_${cacheKey}`;
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
          attractionCache.set(cacheKey, validData);
          return mergeAttractions(validData);
        }
      }
    }
  } catch { /* ignore parse errors */ }

  // 3. Check Firestore persistent cache (Redis replacement)
  try {
    const firestoreRef = doc(db, 'cityAttractions', targetCityId);
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
          attractionCache.set(cacheKey, validData);
          try {
            localStorage.setItem(localCacheKey, JSON.stringify({ data: validData, timestamp: Date.now() }));
          } catch {}
          return mergeAttractions(validData);
        }
      }
    }
  } catch { /* ignore firestore error */ }

  // 4. Fetch from OpenTripMap API if not cached
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
    
    // Normalize lat/lon from point object or root properties and filter invalid coordinates
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

    const finalMerged = mergeAttractions(filtered);

    // Save to memory, localStorage, and Firestore for future instant 0-request loads
    attractionCache.set(cacheKey, finalMerged);
    try {
      localStorage.setItem(localCacheKey, JSON.stringify({
        data: finalMerged,
        timestamp: Date.now()
      }));
    } catch {}

    try {
      setDoc(doc(db, 'cityAttractions', targetCityId), {
        cityName,
        items: finalMerged.slice(0, 500), // store up to 500 places in Redis-style Firestore cache
        updatedAt: new Date().toISOString(),
      });
    } catch {}

    return finalMerged;
  } catch (error) {
    console.error('Error fetching attractions:', error);
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
