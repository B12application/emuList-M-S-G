import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FaArrowLeft, FaSearch, FaCheckCircle, FaRoute, FaMapMarkerAlt,
  FaSpinner, FaFilter, FaStar, FaEye, FaPlus, FaBuilding
} from 'react-icons/fa';
import { fetchAttractionsByCity, fetchAttractionsByDistrict, ATTRACTION_CATEGORIES, getAttractionCategory } from '../../services/travelService';
import { getDistrictsByCityId, type CityDistrict } from '../../data/turkeyDistricts';
import type { TouristAttraction, VisitedPlace, TravelPlan } from '../../../backend/types/travelPlanner';
import type { CityCoordinates } from '../../../backend/types/travelPlanner';
import TravelRouteMap from './TravelRouteMap';
import VisitedPlaceCard from './VisitedPlaceCard';
import CreatePlanModal from './CreatePlanModal';
import CityLeafletMap from './CityLeafletMap';

interface CityDetailViewProps {
  city: CityCoordinates;
  visitedPlaces: VisitedPlace[];
  plans: TravelPlan[];
  onBack: () => void;
  onMarkVisited: (attraction: TouristAttraction) => void;
  onUnmarkVisited: (placeId: string) => void;
  onCreatePlan: (plan: any) => void;
  onDeletePlan: (planId: string) => void;
  onDeleteVisitedPlace: (placeId: string) => void;
}

type TabType = 'attractions' | 'visited' | 'plans';

export default function CityDetailView({
  city,
  visitedPlaces,
  plans,
  onBack,
  onMarkVisited,
  onUnmarkVisited,
  onCreatePlan,
  onDeletePlan,
  onDeleteVisitedPlace,
}: CityDetailViewProps) {
  const [attractions, setAttractions] = useState<TouristAttraction[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('attractions');
  const [isCreatePlanOpen, setIsCreatePlanOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<TravelPlan | null>(null);

  // Available districts for the selected city
  const districts = useMemo(
    () => getDistrictsByCityId(city.id, city.name, city.lat, city.lon),
    [city]
  );

  const [selectedDistrictId, setSelectedDistrictId] = useState<string>(districts[0]?.id || `${city.id.toLowerCase()}_all`);

  // Reset district when city changes
  useEffect(() => {
    if (districts.length > 0) {
      setSelectedDistrictId(districts[0].id);
    }
  }, [city, districts]);

  const currentDistrict = useMemo(
    () => districts.find(d => d.id === selectedDistrictId) || districts[0],
    [districts, selectedDistrictId]
  );

  // Visited attraction IDs for quick lookup
  const visitedXids = useMemo(
    () => new Set(visitedPlaces.map(vp => vp.attractionXid)),
    [visitedPlaces]
  );

  // Fetch attractions on mount or district change
  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    const dist = districts.find(d => d.id === selectedDistrictId) || districts[0];

    if (!dist || dist.id.endsWith('_all')) {
      // If "All Districts" selected, fetch all districts in parallel or city center query
      const specificDistricts = districts.filter(d => !d.id.endsWith('_all'));
      if (specificDistricts.length > 0) {
        Promise.all(specificDistricts.map(d => fetchAttractionsByDistrict(d, city.id)))
          .then(results => {
            if (!cancelled) {
              const combined = results.flat();
              const seenNames = new Set<string>();
              const deduped = combined.filter(a => {
                const norm = (a.name || '').toLowerCase().trim();
                if (!norm || seenNames.has(norm)) return false;
                seenNames.add(norm);
                return true;
              });
              setAttractions(deduped);
              setLoading(false);
            }
          })
          .catch(() => { if (!cancelled) setLoading(false); });
      } else {
        fetchAttractionsByCity(city.name, city.lat, city.lon, 200000, undefined, city.id)
          .then(data => {
            if (!cancelled) { setAttractions(data); setLoading(false); }
          })
          .catch(() => { if (!cancelled) setLoading(false); });
      }
    } else {
      // Fetch specifically for the selected district from OpenTripMap
      fetchAttractionsByDistrict(dist, city.id)
        .then(data => {
          if (!cancelled) {
            setAttractions(data);
            setLoading(false);
          }
        })
        .catch(() => {
          if (!cancelled) setLoading(false);
        });
    }

    return () => { cancelled = true; };
  }, [city, selectedDistrictId, districts]);

  // Filter attractions
  const filteredAttractions = useMemo(() => {
    return attractions.filter(a => {
      const matchesSearch = !searchQuery || a.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = !selectedCategory || a.kinds.toLowerCase().includes(selectedCategory);
      return matchesSearch && matchesCategory;
    });
  }, [attractions, searchQuery, selectedCategory]);

  const cityPlans = plans.filter(p => p.cityId === city.id);

  const tabs: { key: TabType; label: string; icon: any; count: number }[] = [
    { key: 'attractions', label: 'Keşfet', icon: FaMapMarkerAlt, count: attractions.length },
    { key: 'visited', label: 'Gezildi', icon: FaCheckCircle, count: visitedPlaces.filter(v => v.cityId === city.id).length },
    { key: 'plans', label: 'Planlar', icon: FaRoute, count: cityPlans.length },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="h-full flex flex-col"
    >
      {/* City Header */}
      <div className="bg-gradient-to-r from-sky-500 via-cyan-500 to-teal-500 p-5 rounded-t-2xl relative overflow-hidden">
        {/* Decorative circles */}
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full" />
        <div className="absolute -bottom-5 -left-5 w-20 h-20 bg-white/10 rounded-full" />
        
        <div className="relative flex items-center gap-4">
          <button
            onClick={onBack}
            className="p-2.5 bg-white/20 hover:bg-white/30 rounded-xl transition-colors backdrop-blur-sm"
          >
            <FaArrowLeft className="text-white" />
          </button>

          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h2 className="text-2xl font-black text-white">{city.name}</h2>
              <span className="px-2 py-0.5 bg-white/20 rounded-lg text-xs font-bold text-white backdrop-blur-sm">
                {String(city.plateCode).padStart(2, '0')}
              </span>
            </div>
            <p className="text-white/70 text-xs mt-0.5">
              {attractions.length} turistik yer · {visitedPlaces.filter(v => v.cityId === city.id).length} gezildi · {cityPlans.length} plan
            </p>
          </div>

          <button
            onClick={() => setIsCreatePlanOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 rounded-xl text-sm font-bold text-white transition-all backdrop-blur-sm"
          >
            <FaPlus /> Plan Oluştur
          </button>
        </div>

        {/* Tabs */}
        <div className="relative flex gap-1 mt-4 bg-white/10 rounded-xl p-1 backdrop-blur-sm">
          {tabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-bold transition-all ${
                activeTab === tab.key
                  ? 'bg-white text-sky-600 shadow-lg'
                  : 'text-white/70 hover:text-white hover:bg-white/10'
              }`}
            >
              <tab.icon className="text-xs" />
              {tab.label}
              <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${
                activeTab === tab.key ? 'bg-sky-100 text-sky-600' : 'bg-white/20 text-white'
              }`}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto bg-stone-50 dark:bg-zinc-950 rounded-b-2xl">
        <AnimatePresence mode="wait">
          {/* =================== ATTRACTIONS TAB =================== */}
          {activeTab === 'attractions' && (
            <motion.div
              key="attractions"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="p-4"
            >
              {/* Search input */}
              <div className="flex gap-2 mb-3">
                <div className="flex-1 relative">
                  <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 text-xs" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder="Mekan veya yer ara..."
                    className="w-full pl-9 pr-4 py-2.5 bg-white dark:bg-zinc-900 border border-stone-200 dark:border-zinc-800 rounded-xl text-sm text-stone-900 dark:text-white outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>
              </div>

              {/* District Selector Chips */}
              {districts.length > 0 && (
                <div className="mb-3">
                  <div className="flex items-center gap-1.5 mb-1.5 px-0.5">
                    <FaBuilding className="text-sky-500 text-xs" />
                    <span className="text-xs font-black text-stone-800 dark:text-zinc-200">İlçe Seçin:</span>
                  </div>
                  <div className="flex gap-1.5 overflow-x-auto pb-2 scrollbar-thin">
                    {districts.map(d => {
                      const isSelected = selectedDistrictId === d.id;
                      return (
                        <button
                          key={d.id}
                          onClick={() => setSelectedDistrictId(d.id)}
                          className={`shrink-0 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                            isSelected
                              ? 'bg-gradient-to-r from-sky-500 to-cyan-500 text-white shadow-md shadow-sky-500/25 scale-[1.02]'
                              : 'bg-white dark:bg-zinc-900 text-stone-700 dark:text-zinc-300 border border-stone-200 dark:border-zinc-800 hover:border-sky-300 dark:hover:border-sky-700'
                          }`}
                        >
                          <span>{isSelected ? '📍' : '🏛️'}</span>
                          {d.name}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Category filters */}
              <div className="flex gap-1.5 overflow-x-auto pb-3 mb-3 scrollbar-thin">
                <button
                  onClick={() => setSelectedCategory(null)}
                  className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                    !selectedCategory
                      ? 'bg-sky-500 text-white shadow-lg shadow-sky-500/20'
                      : 'bg-white dark:bg-zinc-900 text-stone-600 dark:text-zinc-400 border border-stone-200 dark:border-zinc-800 hover:border-sky-300'
                  }`}
                >
                  Tümü
                </button>
                {ATTRACTION_CATEGORIES.map(cat => (
                  <button
                    key={cat.key}
                    onClick={() => setSelectedCategory(selectedCategory === cat.key ? null : cat.key)}
                    className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1 ${
                      selectedCategory === cat.key
                        ? 'text-white shadow-lg'
                        : 'bg-white dark:bg-zinc-900 text-stone-600 dark:text-zinc-400 border border-stone-200 dark:border-zinc-800 hover:border-sky-300'
                    }`}
                    style={selectedCategory === cat.key ? { backgroundColor: cat.color, boxShadow: `0 4px 12px ${cat.color}33` } : {}}
                  >
                    <span>{cat.icon}</span>
                    {cat.label}
                  </button>
                ))}
              </div>

              {/* Interactive Leaflet Map for City/District POIs */}
              {!loading && (
                <div className="w-full h-80 sm:h-[420px] mb-6 rounded-2xl overflow-hidden shadow-xl border border-stone-200/80 dark:border-zinc-800/80">
                  <CityLeafletMap
                    cityName={currentDistrict ? currentDistrict.name : city.name}
                    cityLat={currentDistrict ? currentDistrict.lat : city.lat}
                    cityLon={currentDistrict ? currentDistrict.lon : city.lon}
                    locationKey={`${city.id}_${selectedDistrictId}`}
                    attractions={filteredAttractions}
                    visitedPlaces={visitedPlaces}
                    onMarkVisited={onMarkVisited}
                  />
                </div>
              )}

              {/* Section Header */}
              <div className="flex items-center justify-between mb-3 px-1">
                <h3 className="text-sm font-black text-stone-900 dark:text-white flex items-center gap-2">
                  <span>📍</span> {currentDistrict?.name || city.name} Gezilecek Yerler ({filteredAttractions.length})
                </h3>
                <span className="text-[10px] text-stone-400 dark:text-zinc-500">
                  OpenTripMap Canlı API ⚡
                </span>
              </div>

              {/* Loading state */}
              {loading ? (
                <div className="flex flex-col items-center justify-center py-16">
                  <FaSpinner className="animate-spin text-sky-500 text-2xl mb-3" />
                  <p className="text-sm text-stone-500 dark:text-zinc-400">Turistik yerler yükleniyor...</p>
                  <p className="text-xs text-stone-400 dark:text-zinc-500 mt-1">OpenTripMap API / Firestore Cache</p>
                </div>
              ) : (
                /* Attraction list grid (1 column on mobile, 2 columns on desktop) */
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pb-8">
                  {filteredAttractions.length === 0 ? (
                    <div className="col-span-full text-center py-12">
                      <span className="text-4xl block mb-3">🔍</span>
                      <p className="text-sm text-stone-500 dark:text-zinc-400">Sonuç bulunamadı</p>
                    </div>
                  ) : (
                    filteredAttractions.map((attraction, index) => {
                      const isVisited = visitedXids.has(attraction.xid);
                      const category = getAttractionCategory(attraction.kinds);

                      return (
                        <motion.div
                          key={attraction.xid}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: Math.min(index * 0.02, 0.4) }}
                          className={`flex items-center gap-3 p-3.5 rounded-2xl border transition-all hover:shadow-md ${
                            isVisited
                              ? 'bg-indigo-50/80 dark:bg-indigo-950/30 border-indigo-300/80 dark:border-indigo-800/60 shadow-sm'
                              : 'bg-white dark:bg-zinc-900 border-stone-200/80 dark:border-zinc-800/80 hover:border-sky-400 dark:hover:border-sky-600'
                          }`}
                        >
                          {/* Category icon */}
                          <div
                            className="w-10 h-10 rounded-xl flex items-center justify-center text-base shrink-0 shadow-sm"
                            style={{ backgroundColor: `${category.color}18` }}
                          >
                            {category.icon}
                          </div>

                          {/* Info */}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-stone-900 dark:text-white truncate">
                              {attraction.name}
                            </p>
                            <div className="flex items-center gap-2 mt-1">
                              <span
                                className="text-[10px] px-2 py-0.5 rounded-full font-bold"
                                style={{ backgroundColor: `${category.color}15`, color: category.color }}
                              >
                                {category.label}
                              </span>
                              {attraction.rate && attraction.rate > 0 && (
                                <span className="flex items-center gap-0.5 text-[10px] font-bold text-amber-500">
                                  <FaStar /> {attraction.rate}
                                </span>
                              )}
                              {attraction.dist && (
                                <span className="text-[10px] text-stone-400 dark:text-zinc-500">
                                  {(attraction.dist / 1000).toFixed(1)} km
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Actions */}
                          <div className="flex items-center gap-1.5 shrink-0">
                            {isVisited ? (
                              <button
                                onClick={() => {
                                  const vp = visitedPlaces.find(v => v.attractionXid === attraction.xid);
                                  if (vp) onUnmarkVisited(vp.id);
                                }}
                                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-indigo-700 dark:text-indigo-300 bg-indigo-100 dark:bg-indigo-900/60 rounded-xl hover:bg-indigo-200 dark:hover:bg-indigo-900 transition-colors shadow-sm"
                              >
                                <span>✓</span> Gezildi
                              </button>
                            ) : (
                              <button
                                onClick={() => onMarkVisited(attraction)}
                                className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-white bg-gradient-to-r from-sky-500 to-cyan-500 rounded-xl shadow-md hover:shadow-sky-500/20 active:scale-95 transition-all"
                              >
                                <FaEye /> Gezdim
                              </button>
                            )}
                          </div>
                        </motion.div>
                      );
                    })
                  )}
                </div>
              )}
            </motion.div>
          )}

          {/* =================== VISITED TAB =================== */}
          {activeTab === 'visited' && (
            <motion.div
              key="visited"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="p-4 space-y-3"
            >
              {visitedPlaces.filter(v => v.cityId === city.id).length === 0 ? (
                <div className="text-center py-16">
                  <span className="text-5xl block mb-3">🌍</span>
                  <p className="text-sm font-medium text-stone-500 dark:text-zinc-400">Henüz gezilen yer yok</p>
                  <p className="text-xs text-stone-400 dark:text-zinc-500 mt-1">Keşfet sekmesinden yer işaretleyin</p>
                </div>
              ) : (
                <AnimatePresence>
                  {visitedPlaces
                    .filter(v => v.cityId === city.id)
                    .map(place => (
                      <VisitedPlaceCard
                        key={place.id}
                        place={place}
                        onDelete={onDeleteVisitedPlace}
                      />
                    ))}
                </AnimatePresence>
              )}
            </motion.div>
          )}

          {/* =================== PLANS TAB =================== */}
          {activeTab === 'plans' && (
            <motion.div
              key="plans"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="p-4"
            >
              {cityPlans.length === 0 ? (
                <div className="text-center py-16">
                  <span className="text-5xl block mb-3">📋</span>
                  <p className="text-sm font-medium text-stone-500 dark:text-zinc-400">Henüz plan yok</p>
                  <button
                    onClick={() => setIsCreatePlanOpen(true)}
                    className="mt-3 px-4 py-2 text-sm font-bold text-white bg-gradient-to-r from-sky-500 to-cyan-500 rounded-xl hover:shadow-lg transition-all"
                  >
                    İlk Planı Oluştur
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {cityPlans.map((plan, index) => (
                    <motion.div
                      key={plan.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="bg-white dark:bg-zinc-900 rounded-2xl border border-stone-200 dark:border-zinc-800 overflow-hidden shadow-sm"
                    >
                      {/* Plan header */}
                      <div
                        className="p-4 cursor-pointer"
                        onClick={() => setSelectedPlan(selectedPlan?.id === plan.id ? null : plan)}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold"
                            style={{ backgroundColor: plan.color || '#0ea5e9' }}
                          >
                            <FaRoute />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="text-sm font-bold text-stone-900 dark:text-white truncate">{plan.title}</h3>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-[10px] text-stone-500 dark:text-zinc-400">{plan.date}</span>
                              <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                                plan.status === 'completed'
                                  ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400'
                                  : plan.status === 'in-progress'
                                  ? 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400'
                                  : 'bg-sky-100 text-sky-600 dark:bg-sky-900/30 dark:text-sky-400'
                              }`}>
                                {plan.status === 'completed' ? 'Tamamlandı' : plan.status === 'in-progress' ? 'Devam Ediyor' : 'Planlandı'}
                              </span>
                              <span className="text-[10px] text-stone-400 dark:text-zinc-500">
                                {plan.stops.length} durak
                              </span>
                            </div>
                          </div>
                          <button
                            onClick={e => { e.stopPropagation(); onDeletePlan(plan.id); }}
                            className="p-2 text-stone-400 hover:text-red-500 transition-colors"
                          >
                            ×
                          </button>
                        </div>
                      </div>

                      {/* Expanded: Route map */}
                      <AnimatePresence>
                        {selectedPlan?.id === plan.id && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.3 }}
                          >
                            <div className="px-4 pb-4">
                              <div className="h-72 mb-3 rounded-2xl overflow-hidden shadow-md">
                                <CityLeafletMap
                                  cityName={city.name}
                                  cityLat={city.lat}
                                  cityLon={city.lon}
                                  routeStops={plan.stops}
                                  planColor={plan.color || '#0ea5e9'}
                                />
                              </div>

                              {/* Stop list */}
                              <div className="space-y-1">
                                {plan.stops.map((stop, i) => (
                                  <div key={i} className="flex items-center gap-2 py-1.5">
                                    <div
                                      className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white ${
                                        stop.visited ? 'bg-emerald-500' : 'bg-sky-500'
                                      }`}
                                    >
                                      {stop.visited ? '✓' : i + 1}
                                    </div>
                                    <span className="text-xs text-stone-700 dark:text-zinc-300 flex-1">{stop.name}</span>
                                    {stop.estimatedTime && (
                                      <span className="text-[10px] text-stone-400 dark:text-zinc-500">{stop.estimatedTime}</span>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Create Plan Modal */}
      <CreatePlanModal
        isOpen={isCreatePlanOpen}
        onClose={() => setIsCreatePlanOpen(false)}
        onSave={onCreatePlan}
        cityName={city.name}
        cityId={city.id}
        availableAttractions={attractions}
      />
    </motion.div>
  );
}
