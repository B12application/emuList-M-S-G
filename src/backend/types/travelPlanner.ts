import type { Timestamp } from 'firebase/firestore';

// Tourist attraction from OpenTripMap API
export interface TouristAttraction {
  xid: string; // OpenTripMap unique ID
  name: string;
  lat: number;
  lon: number;
  kinds: string; // comma-separated: "museums,cultural,interesting_places"
  dist?: number; // distance from center in meters
  rate?: number; // 1-3 rating
  osm?: string;
  wikidata?: string;
}

// Detailed attraction info (from /xid endpoint)
export interface AttractionDetail {
  xid: string;
  name: string;
  lat: number;
  lon: number;
  kinds: string;
  rate: string;
  osm: string;
  wikidata: string;
  wikipedia: string;
  image: string;
  preview?: {
    source: string;
    width: number;
    height: number;
  };
  wikipedia_extracts?: {
    title: string;
    text: string;
    html: string;
  };
  address?: {
    city: string;
    road: string;
    state: string;
    county: string;
    suburb: string;
    country: string;
    postcode: string;
    country_code: string;
    house_number: string;
    city_district: string;
    state_district: string;
  };
  point: {
    lat: number;
    lon: number;
  };
}

// User's visited place record
export interface VisitedPlace {
  id: string;
  attractionXid: string;
  name: string;
  lat: number;
  lon: number;
  cityId: string;
  cityName: string;
  kinds: string;
  visitedAt: Timestamp | string;
  notes?: string;
  rating?: number; // 1-5
  photos?: string[]; // Firebase Storage URLs
}

// Travel plan
export interface TravelPlan {
  id: string;
  userId: string;
  title: string;
  cityId: string;
  cityName: string;
  date: string; // ISO date "2025-08-15"
  endDate?: string;
  type: 'daily' | 'weekly' | 'monthly';
  stops: TravelStop[];
  createdAt: Timestamp | string;
  updatedAt?: Timestamp | string;
  status: 'planned' | 'in-progress' | 'completed';
  notes?: string;
  color?: string; // plan accent color
}

// Individual stop in a plan
export interface TravelStop {
  order: number;
  attractionXid: string;
  name: string;
  lat: number;
  lon: number;
  kinds: string;
  estimatedTime?: string; // "10:00"
  duration?: number; // minutes
  notes?: string;
  visited: boolean;
}

// City with real GPS coordinates for API queries
export interface CityCoordinates {
  id: string;        // matches mapData.ts ID: "TR38"
  name: string;      // "Kayseri"
  lat: number;       // 38.7312
  lon: number;       // 35.4787
  plateCode: number; // 38
}

// Attraction category for filtering
export interface AttractionCategory {
  key: string;
  label: string;
  icon: string;
  color: string;
  kinds: string[]; // OpenTripMap kinds that map to this category
}

// City stats
export interface CityTravelStats {
  cityId: string;
  cityName: string;
  totalAttractions: number;
  visitedCount: number;
  plannedCount: number;
  hasPlans: boolean;
}
