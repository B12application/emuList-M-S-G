import type { CityCoordinates } from '../../backend/types/travelPlanner';

/**
 * Real GPS coordinates for all 81 Turkish provinces.
 * IDs match the SVG map data in mapData.ts (TR01-TR81).
 * Used for OpenTripMap API queries to find attractions near city centers.
 */
export const turkeyCoordinates: CityCoordinates[] = [
  { id: "TR01", name: "Adana", lat: 37.0000, lon: 35.3213, plateCode: 1 },
  { id: "TR02", name: "Adıyaman", lat: 37.7648, lon: 38.2786, plateCode: 2 },
  { id: "TR03", name: "Afyon", lat: 38.7507, lon: 30.5567, plateCode: 3 },
  { id: "TR04", name: "Agri", lat: 39.7191, lon: 43.0503, plateCode: 4 },
  { id: "TR05", name: "Amasya", lat: 40.6499, lon: 35.8353, plateCode: 5 },
  { id: "TR06", name: "Ankara", lat: 39.9334, lon: 32.8597, plateCode: 6 },
  { id: "TR07", name: "Antalya", lat: 36.8969, lon: 30.7133, plateCode: 7 },
  { id: "TR08", name: "Artvin", lat: 41.1828, lon: 41.8183, plateCode: 8 },
  { id: "TR09", name: "Aydın", lat: 37.8560, lon: 27.8416, plateCode: 9 },
  { id: "TR10", name: "Balıkesir", lat: 39.6484, lon: 27.8826, plateCode: 10 },
  { id: "TR11", name: "Bilecik", lat: 40.0567, lon: 30.0665, plateCode: 11 },
  { id: "TR12", name: "Bingöl", lat: 38.8854, lon: 40.4966, plateCode: 12 },
  { id: "TR13", name: "Bitlis", lat: 38.3938, lon: 42.1232, plateCode: 13 },
  { id: "TR14", name: "Bolu", lat: 40.7360, lon: 31.6061, plateCode: 14 },
  { id: "TR15", name: "Burdur", lat: 37.7203, lon: 30.2908, plateCode: 15 },
  { id: "TR16", name: "Bursa", lat: 40.1826, lon: 29.0665, plateCode: 16 },
  { id: "TR17", name: "Çanakkale", lat: 40.1553, lon: 26.4142, plateCode: 17 },
  { id: "TR18", name: "Çankırı", lat: 40.6013, lon: 33.6134, plateCode: 18 },
  { id: "TR19", name: "Çorum", lat: 40.5506, lon: 34.9556, plateCode: 19 },
  { id: "TR20", name: "Denizli", lat: 37.7765, lon: 29.0864, plateCode: 20 },
  { id: "TR21", name: "Diyarbakır", lat: 37.9144, lon: 40.2306, plateCode: 21 },
  { id: "TR22", name: "Edirne", lat: 41.6818, lon: 26.5623, plateCode: 22 },
  { id: "TR23", name: "Elazığ", lat: 38.6810, lon: 39.2264, plateCode: 23 },
  { id: "TR24", name: "Erzincan", lat: 39.7500, lon: 39.5000, plateCode: 24 },
  { id: "TR25", name: "Erzurum", lat: 39.9055, lon: 41.2658, plateCode: 25 },
  { id: "TR26", name: "Eskişehir", lat: 39.7767, lon: 30.5206, plateCode: 26 },
  { id: "TR27", name: "Gaziantep", lat: 37.0662, lon: 37.3833, plateCode: 27 },
  { id: "TR28", name: "Giresun", lat: 40.9128, lon: 38.3895, plateCode: 28 },
  { id: "TR29", name: "Gümüshane", lat: 40.4386, lon: 39.5086, plateCode: 29 },
  { id: "TR30", name: "Hakkari", lat: 37.5833, lon: 43.7333, plateCode: 30 },
  { id: "TR31", name: "Hatay", lat: 36.4018, lon: 36.3498, plateCode: 31 },
  { id: "TR32", name: "Isparta", lat: 37.7648, lon: 30.5566, plateCode: 32 },
  { id: "TR33", name: "Mersin", lat: 36.8121, lon: 34.6415, plateCode: 33 },
  { id: "TR34", name: "İstanbul", lat: 41.0082, lon: 28.9784, plateCode: 34 },
  { id: "TR35", name: "İzmir", lat: 38.4237, lon: 27.1428, plateCode: 35 },
  { id: "TR36", name: "Kars", lat: 40.6167, lon: 43.1000, plateCode: 36 },
  { id: "TR37", name: "Kastamonu", lat: 41.3887, lon: 33.7827, plateCode: 37 },
  { id: "TR38", name: "Kayseri", lat: 38.7312, lon: 35.4787, plateCode: 38 },
  { id: "TR39", name: "Kirklareli", lat: 41.7333, lon: 27.2167, plateCode: 39 },
  { id: "TR40", name: "Kırşehir", lat: 39.1425, lon: 34.1709, plateCode: 40 },
  { id: "TR41", name: "Kocaeli", lat: 40.8533, lon: 29.8815, plateCode: 41 },
  { id: "TR42", name: "Konya", lat: 37.8746, lon: 32.4932, plateCode: 42 },
  { id: "TR43", name: "Kütahya", lat: 39.4167, lon: 29.9833, plateCode: 43 },
  { id: "TR44", name: "Malatya", lat: 38.3552, lon: 38.3095, plateCode: 44 },
  { id: "TR45", name: "Manisa", lat: 38.6191, lon: 27.4289, plateCode: 45 },
  { id: "TR46", name: "Kahramanmaraş", lat: 37.5858, lon: 36.9371, plateCode: 46 },
  { id: "TR47", name: "Mardin", lat: 37.3212, lon: 40.7245, plateCode: 47 },
  { id: "TR48", name: "Muğla", lat: 37.2153, lon: 28.3636, plateCode: 48 },
  { id: "TR49", name: "Muş", lat: 38.9462, lon: 41.7539, plateCode: 49 },
  { id: "TR50", name: "Nevşehir", lat: 38.6939, lon: 34.6857, plateCode: 50 },
  { id: "TR51", name: "Niğde", lat: 37.9667, lon: 34.6833, plateCode: 51 },
  { id: "TR52", name: "Ordu", lat: 40.9839, lon: 37.8764, plateCode: 52 },
  { id: "TR53", name: "Rize", lat: 41.0201, lon: 40.5234, plateCode: 53 },
  { id: "TR54", name: "Sakarya", lat: 40.6940, lon: 30.4358, plateCode: 54 },
  { id: "TR55", name: "Samsun", lat: 41.2928, lon: 36.3313, plateCode: 55 },
  { id: "TR56", name: "Siirt", lat: 37.9333, lon: 41.9500, plateCode: 56 },
  { id: "TR57", name: "Sinop", lat: 42.0231, lon: 35.1531, plateCode: 57 },
  { id: "TR58", name: "Sivas", lat: 39.7477, lon: 37.0179, plateCode: 58 },
  { id: "TR59", name: "Tekirdağ", lat: 41.2824, lon: 27.5113, plateCode: 59 },
  { id: "TR60", name: "Tokat", lat: 40.3167, lon: 36.5500, plateCode: 60 },
  { id: "TR61", name: "Trabzon", lat: 41.0027, lon: 39.7168, plateCode: 61 },
  { id: "TR62", name: "Tunceli", lat: 39.1079, lon: 39.5401, plateCode: 62 },
  { id: "TR63", name: "Şanlıurfa", lat: 37.1591, lon: 38.7969, plateCode: 63 },
  { id: "TR64", name: "Uşak", lat: 38.6823, lon: 29.4082, plateCode: 64 },
  { id: "TR65", name: "Van", lat: 38.4891, lon: 43.4089, plateCode: 65 },
  { id: "TR66", name: "Yozgat", lat: 39.8181, lon: 34.8147, plateCode: 66 },
  { id: "TR67", name: "Zonguldak", lat: 41.4564, lon: 31.7987, plateCode: 67 },
  { id: "TR68", name: "Aksaray", lat: 38.3687, lon: 34.0370, plateCode: 68 },
  { id: "TR69", name: "Bayburt", lat: 40.2552, lon: 40.2249, plateCode: 69 },
  { id: "TR70", name: "Karaman", lat: 37.1759, lon: 33.2287, plateCode: 70 },
  { id: "TR71", name: "Kırıkkale", lat: 39.8468, lon: 33.5153, plateCode: 71 },
  { id: "TR72", name: "Batman", lat: 37.8812, lon: 41.1351, plateCode: 72 },
  { id: "TR73", name: "Sirnak", lat: 37.4187, lon: 42.4918, plateCode: 73 },
  { id: "TR74", name: "Bartın", lat: 41.6344, lon: 32.3375, plateCode: 74 },
  { id: "TR75", name: "Ardahan", lat: 41.1105, lon: 42.7022, plateCode: 75 },
  { id: "TR76", name: "Iğdir", lat: 39.9167, lon: 44.0500, plateCode: 76 },
  { id: "TR77", name: "Yalova", lat: 40.6500, lon: 29.2667, plateCode: 77 },
  { id: "TR78", name: "Karabük", lat: 41.2061, lon: 32.6204, plateCode: 78 },
  { id: "TR79", name: "Kilis", lat: 36.7184, lon: 37.1212, plateCode: 79 },
  { id: "TR80", name: "Osmaniye", lat: 37.0746, lon: 36.2464, plateCode: 80 },
  { id: "TR81", name: "Düzce", lat: 40.8438, lon: 31.1565, plateCode: 81 },
];

/**
 * Get city coordinates by mapData ID
 */
export function getCityById(id: string): CityCoordinates | undefined {
  return turkeyCoordinates.find(c => c.id === id);
}

/**
 * Get city coordinates by name
 */
export function getCityByName(name: string): CityCoordinates | undefined {
  return turkeyCoordinates.find(c => 
    c.name.toLowerCase() === name.toLowerCase()
  );
}
