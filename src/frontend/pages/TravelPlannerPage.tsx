import { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FaMapMarkedAlt, FaSpinner, FaArrowLeft, FaGlobeAmericas,
  FaCompass, FaPlane
} from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { Link } from 'react-router-dom';
import { serverTimestamp } from 'firebase/firestore';
import toast from 'react-hot-toast';

import TurkeyMap from '../components/TurkeyMap';
import TravelStats from '../components/travel/TravelStats';
import CityDetailView from '../components/travel/CityDetailView';

import { turkeyCoordinates, getCityById } from '../data/turkeyCoordinates';
import { turkeyMapData } from '../components/mapData';

import {
  getUserPlans,
  getVisitedPlaces,
  saveVisitedPlace,
  deleteVisitedPlace,
  saveTravelPlan,
  deleteTravelPlan,
} from '../../backend/services/travelPlannerService';
import type { TouristAttraction, VisitedPlace, TravelPlan } from '../../backend/types/travelPlanner';

export default function TravelPlannerPage() {
  const { user } = useAuth();
  const { t } = useLanguage();

  // State
  const [selectedCityId, setSelectedCityId] = useState<string | null>(null);
  const [visitedPlaces, setVisitedPlaces] = useState<VisitedPlace[]>([]);
  const [plans, setPlans] = useState<TravelPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [animatingCity, setAnimatingCity] = useState<string | null>(null);

  // Load data from Firebase
  useEffect(() => {
    if (!user) { setLoading(false); return; }

    const loadData = async () => {
      setLoading(true);
      try {
        const [placesData, plansData] = await Promise.all([
          getVisitedPlaces(user.uid),
          getUserPlans(user.uid),
        ]);
        setVisitedPlaces(placesData);
        setPlans(plansData);
      } catch (error) {
        console.error('Error loading travel data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [user]);

  // Get visited city IDs (cities with at least one visited place)
  const visitedCityIds = useMemo(() => {
    const ids = new Set<string>();
    visitedPlaces.forEach(p => ids.add(p.cityId));
    return ids;
  }, [visitedPlaces]);

  // Get planned city IDs (cities with at least one plan)
  const plannedCityIds = useMemo(() => {
    const ids = new Set<string>();
    plans.forEach(p => ids.add(p.cityId));
    return ids;
  }, [plans]);

  // Province IDs for coloring the map
  // Visited = green, Planned = blue, Neither = gray
  const mapColoredProvinces = useMemo(() => {
    const visited: string[] = [];
    visitedCityIds.forEach(id => visited.push(id));
    return visited;
  }, [visitedCityIds]);

  // Selected city details
  const selectedCity = selectedCityId ? getCityById(selectedCityId) : null;

  // Handle province click on the map
  const handleProvinceClick = useCallback((provinceId: string, _name: string) => {
    setAnimatingCity(provinceId);
    // Small delay for animation effect
    setTimeout(() => {
      setSelectedCityId(provinceId);
      setAnimatingCity(null);
    }, 300);
  }, []);

  // Handle mark as visited
  const handleMarkVisited = useCallback(async (attraction: TouristAttraction) => {
    if (!user || !selectedCityId) return;

    const city = getCityById(selectedCityId);
    if (!city) return;

    try {
      const placeData: Omit<VisitedPlace, 'id'> = {
        attractionXid: attraction.xid,
        name: attraction.name,
        lat: attraction.lat,
        lon: attraction.lon,
        cityId: selectedCityId,
        cityName: city.name,
        kinds: attraction.kinds,
        visitedAt: new Date().toISOString(),
        rating: 0,
      };

      const id = await saveVisitedPlace(user.uid, placeData);
      setVisitedPlaces(prev => [...prev, { ...placeData, id }]);
      toast.success(`${attraction.name} gezildi olarak işaretlendi! ✅`);
    } catch (error) {
      console.error('Error marking visited:', error);
      toast.error('İşaretleme hatası!');
    }
  }, [user, selectedCityId]);

  // Handle unmark visited
  const handleUnmarkVisited = useCallback(async (placeId: string) => {
    if (!user) return;

    try {
      await deleteVisitedPlace(user.uid, placeId);
      setVisitedPlaces(prev => prev.filter(p => p.id !== placeId));
      toast.success('İşaret kaldırıldı');
    } catch (error) {
      console.error('Error unmarking:', error);
      toast.error('Hata oluştu!');
    }
  }, [user]);

  // Handle create plan
  const handleCreatePlan = useCallback(async (planData: any) => {
    if (!user || !selectedCityId) return;

    const city = getCityById(selectedCityId);
    if (!city) return;

    try {
      const plan = {
        title: planData.title,
        cityId: selectedCityId,
        cityName: city.name,
        date: planData.date || new Date().toISOString().split('T')[0],
        ...(planData.endDate ? { endDate: planData.endDate } : {}),
        type: planData.type || 'daily',
        stops: planData.stops || [],
        status: 'planned' as const,
        ...(planData.notes ? { notes: planData.notes } : {}),
        color: planData.color || '#0ea5e9',
      };

      const id = await saveTravelPlan(user.uid, plan);
      setPlans(prev => [{
        ...plan,
        id,
        userId: user.uid,
        createdAt: new Date().toISOString(),
      }, ...prev]);
      toast.success('Plan oluşturuldu! 🗺️');
    } catch (error) {
      console.error('Error creating plan:', error);
      toast.error('Plan oluşturma hatası!');
    }
  }, [user, selectedCityId]);

  // Handle delete plan
  const handleDeletePlan = useCallback(async (planId: string) => {
    if (!user) return;

    try {
      await deleteTravelPlan(user.uid, planId);
      setPlans(prev => prev.filter(p => p.id !== planId));
      toast.success('Plan silindi');
    } catch (error) {
      console.error('Error deleting plan:', error);
      toast.error('Silme hatası!');
    }
  }, [user]);

  // Handle delete visited place
  const handleDeleteVisitedPlace = useCallback(async (placeId: string) => {
    if (!user) return;
    try {
      await deleteVisitedPlace(user.uid, placeId);
      setVisitedPlaces(prev => prev.filter(p => p.id !== placeId));
      toast.success('Gezilen yer silindi');
    } catch (error) {
      toast.error('Silme hatası!');
    }
  }, [user]);

  // Stats
  const stats = useMemo(() => ({
    visitedCities: visitedCityIds.size,
    totalVisitedPlaces: visitedPlaces.length,
    activePlans: plans.filter(p => p.status !== 'completed').length,
    totalAttractions: visitedPlaces.length + plans.reduce((sum, p) => sum + p.stops.length, 0),
  }), [visitedCityIds, visitedPlaces, plans]);

  // Loading
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <div className="relative w-20 h-20 mx-auto mb-4">
            <FaGlobeAmericas className="text-5xl text-sky-500 animate-pulse" />
            <motion.div
              className="absolute -top-1 -right-1"
              animate={{ rotate: 360 }}
              transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
            >
              <FaPlane className="text-amber-500 text-lg" />
            </motion.div>
          </div>
          <p className="text-stone-500 dark:text-zinc-400 text-sm font-medium">Gezi haritanız yükleniyor...</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-4">
      {/* Header */}
      <div className="bg-white dark:bg-zinc-900 border-b border-stone-200 dark:border-zinc-800 mb-4 rounded-2xl sm:rounded-3xl">
        <div className="w-full mx-auto px-4 sm:px-6 lg:px-8 py-5">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl md:text-3xl font-black text-stone-900 dark:text-white flex items-center gap-3">
                <div className="relative">
                  <FaCompass className="text-sky-500" />
                  <motion.div
                    className="absolute -top-1 -right-1 w-2 h-2 bg-amber-400 rounded-full"
                    animate={{ scale: [1, 1.5, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  />
                </div>
                Gezi Planlayıcı
              </h1>
              <p className="text-stone-500 dark:text-zinc-400 mt-1 text-sm hidden sm:block">
                Türkiye'nin güzelliklerini keşfet, planla ve gezdiğin yerleri kaydet
              </p>
            </div>
            <div className="flex items-center gap-2">
              {selectedCityId && (
                <motion.button
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  onClick={() => setSelectedCityId(null)}
                  className="flex items-center gap-2 px-4 py-2 bg-sky-50 dark:bg-sky-900/20 text-sky-600 dark:text-sky-400 rounded-xl hover:bg-sky-100 dark:hover:bg-sky-900/30 transition-all text-sm font-medium"
                >
                  <FaArrowLeft />
                  <span className="hidden sm:inline">Haritaya Dön</span>
                </motion.button>
              )}
              <Link
                to="/map"
                className="flex items-center gap-2 px-4 py-2 bg-stone-100 dark:bg-zinc-800 text-stone-600 dark:text-zinc-400 rounded-xl hover:bg-stone-200 dark:hover:bg-zinc-700 transition-all text-sm font-medium"
              >
                <FaMapMarkedAlt />
                <span className="hidden sm:inline">Ziyaret Haritası</span>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="w-full mx-auto">
        {/* Stats */}
        <div className="mb-4">
          <TravelStats {...stats} />
        </div>

        {/* Map or City Detail */}
        <AnimatePresence mode="wait">
          {!selectedCityId ? (
            /* =================== MAP VIEW =================== */
            <motion.div
              key="map-view"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.4 }}
            >
              {/* Quick city legend */}
              <div className="flex items-center gap-4 mb-3 text-xs text-stone-500 dark:text-zinc-400">
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-emerald-500" />
                  <span>Gezildi</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-sky-500" />
                  <span>Plan Var</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-stone-300 dark:bg-zinc-600" />
                  <span>Keşfedilmedi</span>
                </div>
                <span className="ml-auto text-[10px] text-stone-400 dark:text-zinc-500 hidden sm:block">
                  Bir şehre tıklayarak turistik yerleri keşfedin
                </span>
              </div>

              {/* Map Container */}
              <div
                className="w-full border border-stone-200 dark:border-zinc-700 rounded-2xl overflow-hidden bg-gradient-to-br from-stone-50 to-stone-100 dark:from-zinc-800 dark:to-zinc-900 relative shadow-lg"
                style={{ height: 'calc(100vh - 380px)', minHeight: '400px' }}
              >
                {/* Animated city pulse */}
                {animatingCity && (
                  <motion.div
                    className="absolute inset-0 z-20 flex items-center justify-center pointer-events-none"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    <motion.div
                      className="w-32 h-32 bg-sky-500/20 rounded-full"
                      animate={{ scale: [1, 3, 5], opacity: [0.5, 0.2, 0] }}
                      transition={{ duration: 0.8 }}
                    />
                  </motion.div>
                )}

                {/* Custom colored map */}
                <div className="w-full h-full flex items-center justify-center p-4">
                  <svg
                    baseProfile="tiny"
                    fill="#d1d5db"
                    stroke="#ffffff"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth=".5"
                    version="1.2"
                    viewBox="0 0 1000 422"
                    width="100%"
                    height="100%"
                    xmlns="http://www.w3.org/2000/svg"
                    className="w-full h-full max-w-full max-h-full"
                  >
                    <g id="features">
                      {turkeyMapData.map((province) => {
                        const isVisited = visitedCityIds.has(province.id);
                        const isPlanned = plannedCityIds.has(province.id);
                        const isAnimating = animatingCity === province.id;

                        let fillColor: string;
                        if (isVisited) {
                          fillColor = '#10b981'; // emerald-500
                        } else if (isPlanned) {
                          fillColor = '#0ea5e9'; // sky-500
                        } else {
                          fillColor = document.documentElement.classList.contains('dark') ? '#3f3f46' : '#d1d5db';
                        }

                        return (
                          <path
                            key={province.id}
                            d={province.d}
                            id={province.id}
                            onClick={() => handleProvinceClick(province.id, province.name)}
                            style={{
                              cursor: 'pointer',
                              transition: 'all 0.3s ease',
                              fill: fillColor,
                              filter: isAnimating ? 'brightness(1.3)' : undefined,
                              transform: isAnimating ? 'scale(1.05)' : undefined,
                              transformOrigin: `${province.centroid.x}px ${province.centroid.y}px`,
                            }}
                            className="outline-none hover:brightness-110 hover:drop-shadow-lg"
                            onMouseEnter={e => {
                              (e.target as SVGPathElement).style.filter = 'brightness(1.2) drop-shadow(0 2px 4px rgba(0,0,0,0.2))';
                            }}
                            onMouseLeave={e => {
                              (e.target as SVGPathElement).style.filter = '';
                            }}
                          />
                        );
                      })}

                      {/* Labels */}
                      <g id="labels" style={{ pointerEvents: 'none', userSelect: 'none' }}>
                        {turkeyMapData.map((province) => {
                          const isVisited = visitedCityIds.has(province.id);
                          const isPlanned = plannedCityIds.has(province.id);

                          return (
                            <text
                              key={`label-${province.id}`}
                              x={province.centroid.x}
                              y={province.centroid.y}
                              textAnchor="middle"
                              dominantBaseline="central"
                              style={{
                                fontSize: '10.5px',
                                fontWeight: 800,
                                fill: isVisited || isPlanned ? '#ffffff' : (document.documentElement.classList.contains('dark') ? '#f4f4f5' : '#374151'),
                                stroke: document.documentElement.classList.contains('dark') ? '#000000' : '#ffffff',
                                strokeWidth: '0.5px',
                                paintOrder: 'stroke fill',
                                pointerEvents: 'none',
                                fontFamily: 'system-ui, sans-serif',
                              }}
                            >
                              {province.name}
                            </text>
                          );
                        })}
                      </g>

                      {/* Pins for visited/planned cities */}
                      <g id="pins" style={{ pointerEvents: 'none' }}>
                        {turkeyMapData.map((province) => {
                          const isVisited = visitedCityIds.has(province.id);
                          const isPlanned = !isVisited && plannedCityIds.has(province.id);

                          if (!isVisited && !isPlanned) return null;

                          return (
                            <g key={`pin-${province.id}`}>
                              <circle
                                cx={province.centroid.x}
                                cy={province.centroid.y - 12}
                                r={4}
                                fill={isVisited ? '#10b981' : '#0ea5e9'}
                                stroke="white"
                                strokeWidth="1.5"
                              />
                              {isVisited && (
                                <text
                                  x={province.centroid.x}
                                  y={province.centroid.y - 11.5}
                                  textAnchor="middle"
                                  dominantBaseline="central"
                                  style={{ fontSize: '5px', fill: 'white', fontWeight: 'bold' }}
                                >
                                  ✓
                                </text>
                              )}
                            </g>
                          );
                        })}
                      </g>
                    </g>
                  </svg>
                </div>

                {/* Floating city count */}
                <div className="absolute top-4 left-4 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-md rounded-xl px-4 py-2 shadow-lg border border-stone-200/50 dark:border-zinc-700/50">
                  <div className="text-lg font-black text-stone-900 dark:text-white">
                    {visitedCityIds.size}<span className="text-xs font-normal text-stone-400">/81</span>
                  </div>
                  <div className="text-[10px] text-stone-500 dark:text-zinc-400 font-medium">İl Gezildi</div>
                </div>
              </div>

              {/* Recent activity / planned cities strip */}
              {plans.length > 0 && (
                <div className="mt-4">
                  <h3 className="text-sm font-bold text-stone-700 dark:text-zinc-300 mb-2">Son Planlar</h3>
                  <div className="flex gap-2 overflow-x-auto pb-2">
                    {plans.slice(0, 6).map(plan => (
                      <button
                        key={plan.id}
                        onClick={() => setSelectedCityId(plan.cityId)}
                        className="shrink-0 flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-zinc-900 border border-stone-200 dark:border-zinc-800 rounded-xl hover:border-sky-300 dark:hover:border-sky-700 transition-all shadow-sm"
                      >
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: plan.color || '#0ea5e9' }}
                        />
                        <div className="text-left">
                          <p className="text-xs font-semibold text-stone-800 dark:text-white">{plan.title}</p>
                          <p className="text-[10px] text-stone-400 dark:text-zinc-500">{plan.cityName} · {plan.stops.length} durak</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          ) : (
            /* =================== CITY DETAIL VIEW =================== */
            <motion.div
              key={`city-${selectedCityId}`}
              initial={{ opacity: 0, scale: 1.05 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.4, ease: 'easeOut' }}
              className="w-full min-h-[600px] pb-12"
            >
              {selectedCity && (
                <CityDetailView
                  city={selectedCity}
                  visitedPlaces={visitedPlaces}
                  plans={plans}
                  onBack={() => setSelectedCityId(null)}
                  onMarkVisited={handleMarkVisited}
                  onUnmarkVisited={handleUnmarkVisited}
                  onCreatePlan={handleCreatePlan}
                  onDeletePlan={handleDeletePlan}
                  onDeleteVisitedPlace={handleDeleteVisitedPlace}
                />
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
