import { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { FaExpand, FaCompress, FaTimes } from 'react-icons/fa';
import type { TouristAttraction, VisitedPlace, TravelStop } from '../../../backend/types/travelPlanner';
import { getAttractionCategory } from '../../services/travelService';

// Fix Leaflet default marker icon issue with bundlers
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

// Custom colored pin icons
function createPinIcon(color: string, size: number = 28): L.DivIcon {
  return L.divIcon({
    className: 'custom-pin-icon',
    html: `
      <div style="
        width: ${size}px; height: ${size}px;
        background: ${color};
        border: 3px solid white;
        border-radius: 50% 50% 50% 0;
        transform: rotate(-45deg);
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        display: flex; align-items: center; justify-content: center;
      ">
        <div style="
          width: ${size * 0.4}px; height: ${size * 0.4}px;
          background: white;
          border-radius: 50%;
          transform: rotate(45deg);
        "></div>
      </div>
    `,
    iconSize: [size, size],
    iconAnchor: [size / 2, size],
    popupAnchor: [0, -size],
  });
}

// Numbered pin icons for plan routes
function createNumberedPinIcon(number: number, color: string = '#0ea5e9', isVisited: boolean = false): L.DivIcon {
  const bg = isVisited ? '#10b981' : color;
  return L.divIcon({
    className: 'custom-numbered-pin',
    html: `
      <div style="
        width: 32px; height: 32px;
        background: ${bg};
        border: 3px solid white;
        border-radius: 50% 50% 50% 0;
        transform: rotate(-45deg);
        box-shadow: 0 4px 12px rgba(0,0,0,0.35);
        display: flex; align-items: center; justify-content: center;
      ">
        <span style="
          transform: rotate(45deg);
          color: white;
          font-weight: 900;
          font-size: 13px;
          font-family: sans-serif;
        ">${number}</span>
      </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32],
  });
}

// Predefined icons
const visitedIcon = createPinIcon('#10b981', 30);   // emerald
const plannedIcon = createPinIcon('#0ea5e9', 28);    // sky
const defaultIcon = createPinIcon('#ef4444', 26);    // red
const selectedIcon = createPinIcon('#f59e0b', 34);   // amber (larger)

// Category-based icons
function getCategoryIcon(kinds: string, isVisited: boolean): L.DivIcon {
  if (isVisited) return visitedIcon;
  const cat = getAttractionCategory(kinds);
  return createPinIcon(cat.color, 26);
}

// Component to fit map bounds to markers or route stops
function FitBounds({ attractions, routeStops, cityLat, cityLon }: { attractions?: TouristAttraction[]; routeStops?: TravelStop[]; cityLat: number; cityLon: number }) {
  const map = useMap();

  useEffect(() => {
    const points: [number, number][] = [];

    if (routeStops && routeStops.length > 0) {
      routeStops.forEach(s => {
        if (typeof s.lat === 'number' && typeof s.lon === 'number' && !isNaN(s.lat) && !isNaN(s.lon)) {
          points.push([s.lat, s.lon]);
        }
      });
    } else if (attractions && attractions.length > 0) {
      attractions.forEach(a => {
        if (typeof a.lat === 'number' && typeof a.lon === 'number' && !isNaN(a.lat) && !isNaN(a.lon)) {
          points.push([a.lat, a.lon]);
        }
      });
    }

    const safeLat = Number(cityLat) || 38.7312;
    const safeLon = Number(cityLon) || 35.4787;

    if (points.length === 0) {
      map.setView([safeLat, safeLon], 11);
      return;
    }

    try {
      const bounds = L.latLngBounds(points);
      bounds.extend([safeLat, safeLon]);
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 13 });
    } catch (e) {
      map.setView([safeLat, safeLon], 11);
    }
  }, [attractions, routeStops, cityLat, cityLon, map]);

  return null;
}

interface CityLeafletMapProps {
  cityName: string;
  cityLat: number;
  cityLon: number;
  attractions?: TouristAttraction[];
  visitedPlaces?: VisitedPlace[];
  routeStops?: TravelStop[];
  planColor?: string;
  selectedAttractionId?: string;
  onAttractionClick?: (attraction: TouristAttraction) => void;
  onMarkVisited?: (attraction: TouristAttraction) => void;
}

export default function CityLeafletMap({
  cityName,
  cityLat,
  cityLon,
  attractions = [],
  visitedPlaces = [],
  routeStops,
  planColor = '#0ea5e9',
  selectedAttractionId,
  onAttractionClick,
  onMarkVisited,
}: CityLeafletMapProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const visitedXids = new Set(visitedPlaces.map(vp => vp.attractionXid));

  const safeCityLat = Number(cityLat) || 38.7312;
  const safeCityLon = Number(cityLon) || 35.4787;

  const validAttractions = attractions.filter(
    a => typeof a.lat === 'number' && typeof a.lon === 'number' && !isNaN(a.lat) && !isNaN(a.lon)
  );

  const validRouteStops = (routeStops || []).filter(
    s => typeof s.lat === 'number' && typeof s.lon === 'number' && !isNaN(s.lat) && !isNaN(s.lon)
  );

  const mapContent = (
    <MapContainer
      center={[safeCityLat, safeCityLon]}
      zoom={11}
      preferCanvas={true}
      scrollWheelZoom={true}
      zoomControl={true}
      style={{ width: '100%', height: '100%' }}
      className="z-0"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      <FitBounds attractions={validAttractions} routeStops={validRouteStops} cityLat={safeCityLat} cityLon={safeCityLon} />

        {/* Route Polyline connecting stops in order */}
        {validRouteStops.length > 1 && (
          <Polyline
            positions={validRouteStops.map(s => [s.lat, s.lon])}
            pathOptions={{
              color: planColor,
              weight: 4,
              dashArray: '8, 8',
              opacity: 0.85,
            }}
          />
        )}

        {/* Plan Route Markers */}
        {validRouteStops.length > 0 && validRouteStops.map(stop => (
          <Marker
            key={`route_stop_${stop.order}`}
            position={[stop.lat, stop.lon]}
            icon={createNumberedPinIcon(stop.order, planColor, stop.visited)}
          >
            <Popup>
              <div className="min-w-[150px]">
                <div className="flex items-center gap-2 mb-1">
                  <span className="w-5 h-5 rounded-full bg-sky-500 text-white font-bold text-xs flex items-center justify-center">
                    {stop.order}
                  </span>
                  <strong className="text-sm">{stop.name}</strong>
                </div>
                {stop.estimatedTime && (
                  <div className="text-xs text-stone-500 mb-1">⏰ Saat: {stop.estimatedTime}</div>
                )}
                {stop.visited ? (
                  <span className="text-xs font-bold text-emerald-600">✅ Tamamlandı</span>
                ) : (
                  <span className="text-xs text-sky-600 font-medium">📍 Durak #{stop.order}</span>
                )}
              </div>
            </Popup>
          </Marker>
        ))}

        {/* General Attraction markers when not in pure route mode */}
        {validRouteStops.length === 0 && validAttractions.map(attraction => {
          const isVisited = visitedXids.has(attraction.xid);
          const isSelected = attraction.xid === selectedAttractionId;
          const category = getAttractionCategory(attraction.kinds);
          const icon = isSelected ? selectedIcon : isVisited ? visitedIcon : getCategoryIcon(attraction.kinds, false);

          return (
            <Marker
              key={attraction.xid}
              position={[attraction.lat, attraction.lon]}
              icon={icon}
              eventHandlers={{
                click: () => onAttractionClick?.(attraction),
              }}
            >
              <Popup>
                <div className="min-w-[180px]">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-lg">{category.icon}</span>
                    <strong className="text-sm">{attraction.name}</strong>
                  </div>
                  <div className="flex items-center gap-1 mb-2">
                    <span
                      className="text-[10px] px-1.5 py-0.5 rounded-full font-medium text-white"
                      style={{ backgroundColor: category.color }}
                    >
                      {category.label}
                    </span>
                    {attraction.rate && attraction.rate > 0 && (
                      <span className="text-[10px] text-amber-600">⭐ {attraction.rate}</span>
                    )}
                  </div>
                  {isVisited ? (
                    <div className="flex items-center gap-1 text-emerald-600 text-xs font-bold">
                      ✅ Gezildi
                    </div>
                  ) : (
                    <button
                      onClick={() => onMarkVisited?.(attraction)}
                      className="w-full py-1.5 text-xs font-bold text-white bg-sky-500 hover:bg-sky-600 rounded-lg transition-colors"
                    >
                      📍 Gezdim İşaretle
                    </button>
                  )}
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
  );

  return (
    <>
      {/* Normal Map Container */}
      <div className="w-full h-full rounded-2xl overflow-hidden border border-stone-200 dark:border-zinc-700 relative group">
        {/* City name overlay */}
        <div className="absolute top-3 left-3 z-[1000] bg-white/90 dark:bg-zinc-900/90 backdrop-blur-md rounded-xl px-3 py-1.5 shadow-lg border border-stone-200/50 dark:border-zinc-700/50">
          <div className="flex items-center gap-2">
            <span className="text-sm">📍</span>
            <span className="text-sm font-bold text-stone-800 dark:text-white">{cityName}</span>
            <span className="text-[10px] px-1.5 py-0.5 bg-sky-100 dark:bg-sky-900/30 text-sky-600 dark:text-sky-400 rounded-full font-bold">
              {validAttractions.length} yer
            </span>
          </div>
        </div>

        {/* Fullscreen Expand Button */}
        <button
          onClick={() => setIsFullscreen(true)}
          className="absolute top-3 right-3 z-[1000] p-2.5 bg-white/90 dark:bg-zinc-900/90 hover:bg-white dark:hover:bg-zinc-800 backdrop-blur-md rounded-xl shadow-lg border border-stone-200/50 dark:border-zinc-700/50 text-stone-700 dark:text-zinc-200 transition-all active:scale-95 flex items-center gap-1.5 text-xs font-bold"
          title="Haritayı Büyüt (Modal)"
        >
          <FaExpand className="text-sky-500" />
          <span className="hidden sm:inline">Genişlet</span>
        </button>

        {/* Legend */}
        <div className="absolute bottom-3 left-3 z-[1000] bg-white/90 dark:bg-zinc-900/90 backdrop-blur-md rounded-xl px-3 py-2 shadow-lg border border-stone-200/50 dark:border-zinc-700/50">
          <div className="flex items-center gap-3 text-[10px] text-stone-600 dark:text-zinc-400">
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full bg-emerald-500 border border-white" />
              <span>Gezildi</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full bg-red-500 border border-white" />
              <span>Gezilecek</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full bg-amber-500 border border-white" />
              <span>Seçili</span>
            </div>
          </div>
        </div>

        {mapContent}
      </div>

      {/* Fullscreen Modal Backdrop */}
      {isFullscreen && (
        <div className="fixed inset-0 z-[3000] p-4 sm:p-8 bg-black/75 backdrop-blur-md flex flex-col items-center justify-center">
          <div className="w-full h-full max-w-6xl max-h-[90vh] bg-white dark:bg-zinc-900 rounded-3xl overflow-hidden shadow-2xl relative flex flex-col border border-stone-200 dark:border-zinc-800">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 bg-white/90 dark:bg-zinc-900/90 border-b border-stone-200 dark:border-zinc-800 z-[1001]">
              <div className="flex items-center gap-2">
                <span className="text-xl">🗺️</span>
                <div>
                  <h3 className="text-base font-black text-stone-900 dark:text-white">{cityName} İnteraktif Haritası</h3>
                  <p className="text-xs text-stone-500 dark:text-zinc-400">Scroll ve dokunma ile yakınlaştırın, pinleri detaylı inceleyin</p>
                </div>
              </div>
              <button
                onClick={() => setIsFullscreen(false)}
                className="p-2.5 bg-stone-100 dark:bg-zinc-800 hover:bg-red-100 hover:text-red-600 rounded-xl transition-colors"
              >
                <FaTimes />
              </button>
            </div>

            {/* Modal Map View */}
            <div className="flex-1 relative w-full h-full">
              {mapContent}
            </div>
          </div>
        </div>
      )}

      {/* Custom CSS for pin icons */}
      <style>{`
        .custom-pin-icon {
          background: transparent !important;
          border: none !important;
        }
        .leaflet-popup-content-wrapper {
          border-radius: 12px;
          box-shadow: 0 4px 20px rgba(0,0,0,0.15);
        }
        .leaflet-popup-tip {
          box-shadow: none;
        }
      `}</style>
    </>
  );
}
