export interface CityDistrict {
  id: string;
  name: string;
  lat: number;
  lon: number;
  radius?: number; // custom search radius in meters (default ~20000)
}

/**
 * Detailed district coordinates for Turkish provinces (TR01 - TR81).
 * Allows users to filter attractions district-by-district and fetch OpenTripMap POIs precisely per district.
 */
export const TURKEY_DISTRICTS: Record<string, CityDistrict[]> = {
  "TR07": [ // Antalya
    { id: "tr07_all", name: "Tüm Antalya", lat: 36.8969, lon: 30.7133, radius: 200000 },
    { id: "tr07_muratpasa", name: "Muratpaşa (Merkez)", lat: 36.8841, lon: 30.7056, radius: 15000 },
    { id: "tr07_konyaalti", name: "Konyaaltı", lat: 36.8778, lon: 30.6472, radius: 20000 },
    { id: "tr07_kepez", name: "Kepez", lat: 36.9400, lon: 30.6800, radius: 15000 },
    { id: "tr07_alanya", name: "Alanya", lat: 36.5438, lon: 31.9998, radius: 30000 },
    { id: "tr07_manavgat", name: "Manavgat & Side", lat: 36.7869, lon: 31.3864, radius: 25000 },
    { id: "tr07_kemer", name: "Kemer & Olimpos", lat: 36.6025, lon: 30.5594, radius: 25000 },
    { id: "tr07_kas", name: "Kaş & Kalkan", lat: 36.2018, lon: 29.6377, radius: 30000 },
    { id: "tr07_demre", name: "Demre (Kale)", lat: 36.2442, lon: 29.9847, radius: 20000 },
    { id: "tr07_serik", name: "Serik & Aspendos", lat: 36.9167, lon: 31.1700, radius: 25000 },
    { id: "tr07_kumluca", name: "Kumluca & Adrasan", lat: 36.3686, lon: 30.2881, radius: 25000 },
    { id: "tr07_finike", name: "Finike", lat: 36.2944, lon: 30.1417, radius: 20000 },
    { id: "tr07_gazipasa", name: "Gazipaşa", lat: 36.2736, lon: 32.3169, radius: 25000 },
  ],
  "TR48": [ // Muğla
    { id: "tr48_all", name: "Tüm Muğla", lat: 37.2153, lon: 28.3636, radius: 200000 },
    { id: "tr48_bodrum", name: "Bodrum", lat: 37.0344, lon: 27.4305, radius: 25000 },
    { id: "tr48_fethiye", name: "Fethiye & Ölüdeniz", lat: 36.6217, lon: 29.1164, radius: 30000 },
    { id: "tr48_marmaris", name: "Marmaris", lat: 36.8550, lon: 28.2742, radius: 25000 },
    { id: "tr48_datca", name: "Datça", lat: 36.7262, lon: 27.6853, radius: 25000 },
    { id: "tr48_dalyan", name: "Ortaca & Dalyan", lat: 36.8364, lon: 28.6364, radius: 20000 },
    { id: "tr48_koycegiz", name: "Köyceğiz", lat: 36.9667, lon: 28.6833, radius: 20000 },
    { id: "tr48_milas", name: "Milas", lat: 37.3167, lon: 27.7833, radius: 25000 },
  ],
  "TR35": [ // İzmir
    { id: "tr35_all", name: "Tüm İzmir", lat: 38.4237, lon: 27.1428, radius: 150000 },
    { id: "tr35_konak", name: "Konak (Merkez)", lat: 38.4189, lon: 27.1286, radius: 15000 },
    { id: "tr35_cesme", name: "Çeşme & Alaçatı", lat: 38.3236, lon: 26.3042, radius: 25000 },
    { id: "tr35_selcuk", name: "Selçuk & Efes", lat: 37.9483, lon: 27.3681, radius: 20000 },
    { id: "tr35_bergama", name: "Bergama", lat: 39.1233, lon: 27.1783, radius: 25000 },
    { id: "tr35_foca", name: "Foça", lat: 38.6708, lon: 26.7575, radius: 20000 },
    { id: "tr35_urla", name: "Urla", lat: 38.3225, lon: 26.7642, radius: 20000 },
    { id: "tr35_karsiyaka", name: "Karşıyaka", lat: 38.4594, lon: 27.1103, radius: 15000 },
  ],
  "TR34": [ // İstanbul
    { id: "tr34_all", name: "Tüm İstanbul", lat: 41.0082, lon: 28.9784, radius: 100000 },
    { id: "tr34_fatih", name: "Fatih (Tarihi Yarımada)", lat: 41.0082, lon: 28.9784, radius: 10000 },
    { id: "tr34_beyoglu", name: "Beyoğlu (Taksim/Galata)", lat: 41.0256, lon: 28.9742, radius: 10000 },
    { id: "tr34_kadikoy", name: "Kadıköy & Moda", lat: 40.9901, lon: 29.0292, radius: 10000 },
    { id: "tr34_uskudar", name: "Üsküdar", lat: 41.0267, lon: 29.0153, radius: 10000 },
    { id: "tr34_besiktas", name: "Beşiktaş & Ortaköy", lat: 41.0422, lon: 29.0083, radius: 10000 },
    { id: "tr34_adalar", name: "Prens Adaları (Büyükada)", lat: 40.8719, lon: 29.0911, radius: 15000 },
    { id: "tr34_sile", name: "Şile & Ağva", lat: 41.1747, lon: 29.6125, radius: 30000 },
    { id: "tr34_sariyer", name: "Sarıyer & Rumelihisarı", lat: 41.1667, lon: 29.0500, radius: 15000 },
  ],
  "TR61": [ // Trabzon
    { id: "tr61_all", name: "Tüm Trabzon", lat: 41.0027, lon: 39.7168, radius: 150000 },
    { id: "tr61_ortahisar", name: "Ortahisar (Merkez)", lat: 41.0027, lon: 39.7168, radius: 15000 },
    { id: "tr61_macka", name: "Maçka (Sümela)", lat: 40.8125, lon: 39.6583, radius: 25000 },
    { id: "tr61_caykara", name: "Çaykara (Uzungöl)", lat: 40.6186, lon: 39.1333, radius: 25000 },
    { id: "tr61_akcaabat", name: "Akçaabat", lat: 41.0189, lon: 39.5742, radius: 20000 },
  ],
  "TR50": [ // Nevşehir (Kapadokya)
    { id: "tr50_all", name: "Tüm Nevşehir (Kapadokya)", lat: 38.6939, lon: 34.6857, radius: 80000 },
    { id: "tr50_goreme", name: "Göreme & Çavuşin", lat: 38.6400, lon: 34.8292, radius: 15000 },
    { id: "tr50_urgup", name: "Ürgüp & Ortahisar", lat: 38.6317, lon: 34.9125, radius: 15000 },
    { id: "tr50_avanos", name: "Avanos & Paşabağları", lat: 38.7183, lon: 34.8450, radius: 15000 },
    { id: "tr50_uchisar", name: "Uçhisar", lat: 38.6300, lon: 34.8058, radius: 10000 },
    { id: "tr50_derinkuyu", name: "Derinkuyu & Kaymaklı", lat: 38.3736, lon: 34.7347, radius: 20000 },
  ],
  "TR16": [ // Bursa
    { id: "tr16_all", name: "Tüm Bursa", lat: 40.1826, lon: 29.0665, radius: 120000 },
    { id: "tr16_osmangazi", name: "Osmangazi (Merkez)", lat: 40.1826, lon: 29.0665, radius: 15000 },
    { id: "tr16_nilufer", name: "Nilüfer & Gölyazı", lat: 40.2167, lon: 28.9833, radius: 20000 },
    { id: "tr16_mudanya", name: "Mudanya & Tirilye", lat: 40.3753, lon: 28.8822, radius: 20000 },
    { id: "tr16_iznik", name: "İznik", lat: 40.4286, lon: 29.7214, radius: 25000 },
    { id: "tr16_inegol", name: "İnegöl & Oylat", lat: 40.0806, lon: 29.5103, radius: 25000 },
  ],
  "TR38": [ // Kayseri
    { id: "tr38_all", name: "Tüm Kayseri", lat: 38.7312, lon: 35.4787, radius: 150000 },
    { id: "tr38_melikgazi", name: "Melikgazi (Merkez)", lat: 38.7225, lon: 35.4881, radius: 15000 },
    { id: "tr38_erciyes", name: "Erciyes Dağı", lat: 38.5372, lon: 35.5342, radius: 20000 },
    { id: "tr38_yahyali", name: "Yahyalı (Kapuzbaşı)", lat: 37.7783, lon: 35.3933, radius: 30000 },
    { id: "tr38_develi", name: "Develi (Sultan Sazlığı)", lat: 38.3333, lon: 35.2500, radius: 25000 },
    { id: "tr38_yesilhisar", name: "Yeşilhisar (Soğanlı)", lat: 38.3414, lon: 34.9744, radius: 25000 },
  ],
  "TR58": [ // Sivas
    { id: "tr58_all", name: "Tüm Sivas", lat: 39.7477, lon: 37.0179, radius: 200000 },
    { id: "tr58_merkez", name: "Sivas Merkez", lat: 39.7477, lon: 37.0179, radius: 15000 },
    { id: "tr58_divrigi", name: "Divriği", lat: 39.3733, lon: 38.1147, radius: 30000 },
    { id: "tr58_gemerek", name: "Gemerek (Sızır)", lat: 39.3403, lon: 35.9619, radius: 25000 },
    { id: "tr58_kangal", name: "Kangal", lat: 39.2319, lon: 37.4786, radius: 25000 },
  ],
};

/**
 * Helper to get districts for any city ID (TR01-TR81).
 * Returns custom defined districts if available, or default "Tüm Şehir" and "Merkez" districts.
 */
export function getDistrictsByCityId(cityId: string, cityName: string, cityLat: number, cityLon: number): CityDistrict[] {
  const customDistricts = TURKEY_DISTRICTS[cityId.toUpperCase()];
  if (customDistricts && customDistricts.length > 0) {
    return customDistricts;
  }

  return [
    {
      id: `${cityId.toLowerCase()}_all`,
      name: `Tüm ${cityName}`,
      lat: cityLat,
      lon: cityLon,
      radius: 150000,
    },
    {
      id: `${cityId.toLowerCase()}_center`,
      name: `${cityName} Merkez`,
      lat: cityLat,
      lon: cityLon,
      radius: 20000,
    },
  ];
}
