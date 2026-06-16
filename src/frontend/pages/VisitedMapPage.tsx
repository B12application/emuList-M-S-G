import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { db } from '../../backend/config/firebaseConfig';
import { doc, getDoc, updateDoc, arrayUnion, arrayRemove, setDoc } from 'firebase/firestore';
import { FaSpinner, FaMapMarkedAlt, FaCity, FaCheckCircle, FaArrowLeft } from 'react-icons/fa';
import { TransformWrapper, TransformComponent, type ReactZoomPanPinchRef } from "react-zoom-pan-pinch";
import { FaPlus, FaMinus, FaExpand, FaArrowUp, FaArrowDown, FaArrowRight } from "react-icons/fa6";
import { useLanguage } from '../context/LanguageContext';
import toast from 'react-hot-toast';
import TurkeyMap from '../components/TurkeyMap';
import { Link } from 'react-router-dom';
import React from 'react';

export default function VisitedMapPage() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [visitedProvinces, setVisitedProvinces] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const [transformState, setTransformState] = useState({ positionX: 0, positionY: 0, scale: 1 });
  const transformRef = React.useRef<ReactZoomPanPinchRef>(null);

  // Calculate progress
  const progressPercent = Math.round((visitedProvinces.length / 81) * 100);

  const handleProvinceClick = async (provinceId: string) => {
    if (!user) return;
    const userDocRef = doc(db, 'users', user.uid);
    const isVisited = visitedProvinces.includes(provinceId);

    setVisitedProvinces(prev =>
      isVisited ? prev.filter(p => p !== provinceId) : [...prev, provinceId]
    );

    try {
      await setDoc(userDocRef, {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName
      }, { merge: true });

      if (isVisited) {
        await updateDoc(userDocRef, { visitedProvinces: arrayRemove(provinceId) });
        toast.success(t('Haritadan kaldırıldı'), { duration: 2000 });
      } else {
        await updateDoc(userDocRef, { visitedProvinces: arrayUnion(provinceId) });
        toast.success(t('Haritaya eklendi'), { duration: 2000 });
      }
    } catch (e) {
      console.error("Kaydetme hatası: ", e);
      setVisitedProvinces(visitedProvinces);
      toast.error(t('Hata oluştu'));
    }
  };

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    const fetchVisitedProvinces = async () => {
      setLoading(true);
      try {
        const userDocRef = doc(db, 'users', user.uid);
        const docSnap = await getDoc(userDocRef);
        if (docSnap.exists() && docSnap.data().visitedProvinces) {
          setVisitedProvinces(docSnap.data().visitedProvinces);
        } else {
          await setDoc(userDocRef, { visitedProvinces: [] }, { merge: true });
          setVisitedProvinces([]);
        }
      } catch (error) { console.error("Veri hatası:", error); }
      finally { setLoading(false); }
    };
    fetchVisitedProvinces();
  }, [user]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <FaSpinner className="animate-spin h-8 w-8 text-sky-500 mx-auto mb-4" />
          <p className="text-stone-500 dark:text-zinc-400 text-lg">{t('mapPage.loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-4">
      {/* Header */}
      <div className="bg-white dark:bg-zinc-900 border-b border-stone-200 dark:border-zinc-800 mb-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl md:text-3xl font-black text-stone-900 dark:text-white flex items-center gap-3">
                <FaMapMarkedAlt className="text-sky-500" />
                {t('mapPage.title')}
              </h1>
              <p className="text-stone-500 dark:text-zinc-400 mt-1 text-sm hidden sm:block">
                {t('mapPage.instructions')}
              </p>
            </div>
            <Link
              to="/profile"
              className="flex items-center gap-2 px-4 py-2 bg-stone-100 dark:bg-zinc-800 text-stone-600 dark:text-zinc-400 rounded-xl hover:bg-stone-200 dark:hover:bg-zinc-700 transition-all text-sm font-medium"
            >
              <FaArrowLeft />
              <span className="hidden sm:inline">Profile Dön</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
          {/* Visited Count */}
          <div className="bg-white dark:bg-zinc-900 rounded-2xl p-4 shadow-sm border border-stone-200 dark:border-zinc-800 flex items-center gap-4">
            <div className="p-3 bg-sky-100 dark:bg-sky-900/20 rounded-xl">
              <FaCity className="text-sky-600 dark:text-sky-400 text-xl" />
            </div>
            <div>
              <div className="text-2xl font-black text-stone-900 dark:text-white">{visitedProvinces.length}<span className="text-base font-normal text-stone-400">/81</span></div>
              <div className="text-xs text-stone-500 dark:text-zinc-400 font-medium">{t('mapPage.visited')}</div>
            </div>
          </div>

          {/* Progress */}
          <div className="bg-white dark:bg-zinc-900 rounded-2xl p-4 shadow-sm border border-stone-200 dark:border-zinc-800 flex items-center gap-4">
            <div className="p-3 bg-emerald-100 dark:bg-emerald-900/20 rounded-xl">
              <FaCheckCircle className="text-emerald-600 dark:text-emerald-400 text-xl" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-bold text-stone-900 dark:text-white">%{progressPercent}</span>
                <span className="text-xs text-stone-500 dark:text-zinc-400">Tamamlandı</span>
              </div>
              <div className="w-full h-2 bg-stone-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-500"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
          </div>

          {/* Remaining */}
          <div className="bg-white dark:bg-zinc-900 rounded-2xl p-4 shadow-sm border border-stone-200 dark:border-zinc-800 flex items-center gap-4">
            <div className="p-3 bg-amber-100 dark:bg-amber-900/20 rounded-xl">
              <FaMapMarkedAlt className="text-amber-600 dark:text-amber-400 text-xl" />
            </div>
            <div>
              <div className="text-2xl font-black text-stone-900 dark:text-white">{81 - visitedProvinces.length}</div>
              <div className="text-xs text-stone-500 dark:text-zinc-400 font-medium">Kalan Şehir</div>
            </div>
          </div>
        </div>

        {/* Mobile Instructions */}
        <p className="sm:hidden text-xs text-stone-500 dark:text-zinc-400 mb-3 px-1">
          Yakınlaştırmak için parmaklarını kullan. Seçmek için şehre dokun.
        </p>

        {/* Map Container */}
        <div className="w-full border border-stone-200 dark:border-zinc-700 rounded-2xl overflow-hidden bg-stone-50 dark:bg-zinc-800 relative shadow-lg" style={{ height: 'calc(100vh - 320px)', minHeight: '400px' }}>
          <TransformWrapper
            ref={transformRef}
            initialScale={1}
            minScale={0.5}
            maxScale={8}
            centerOnInit={true}
            limitToBounds={false}
            onTransformed={(_ref, state) => setTransformState({ positionX: state.positionX, positionY: state.positionY, scale: state.scale })}
            wheel={{ step: 0.1 }}
            pinch={{ step: 5 }}
          >
            {({ zoomIn, zoomOut, resetTransform, setTransform }) => (
              <>
                {/* Control Panel */}
                <div className="absolute bottom-4 right-4 z-10 flex flex-col gap-3">
                  {/* Pan Controls - Desktop Only */}
                  <div className="hidden md:block bg-white/90 dark:bg-zinc-900/90 p-2 rounded-xl shadow-lg backdrop-blur-md border border-stone-200/50 dark:border-zinc-700/50">
                    <div className="grid grid-cols-3 grid-rows-3 gap-1">
                      <div></div>
                      <button
                        onClick={() => setTransform(transformState.positionX, transformState.positionY - 50, transformState.scale)}
                        className="p-2.5 bg-stone-100 hover:bg-stone-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-stone-700 dark:text-zinc-200 rounded-lg transition-all active:scale-95"
                        title="Yukarı"
                      >
                        <FaArrowUp className="text-xs" />
                      </button>
                      <div></div>
                      <button
                        onClick={() => setTransform(transformState.positionX - 50, transformState.positionY, transformState.scale)}
                        className="p-2.5 bg-stone-100 hover:bg-stone-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-stone-700 dark:text-zinc-200 rounded-lg transition-all active:scale-95"
                        title="Sol"
                      >
                        <FaArrowLeft className="text-xs" />
                      </button>
                      <div className="bg-stone-50 dark:bg-zinc-900 rounded-lg flex items-center justify-center border border-stone-200 dark:border-zinc-700">
                        <div className="w-1.5 h-1.5 rounded-full bg-stone-300 dark:bg-zinc-600"></div>
                      </div>
                      <button
                        onClick={() => setTransform(transformState.positionX + 50, transformState.positionY, transformState.scale)}
                        className="p-2.5 bg-stone-100 hover:bg-stone-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-stone-700 dark:text-zinc-200 rounded-lg transition-all active:scale-95"
                        title="Sağ"
                      >
                        <FaArrowRight className="text-xs" />
                      </button>
                      <div></div>
                      <button
                        onClick={() => setTransform(transformState.positionX, transformState.positionY + 50, transformState.scale)}
                        className="p-2.5 bg-stone-100 hover:bg-stone-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-stone-700 dark:text-zinc-200 rounded-lg transition-all active:scale-95"
                        title="Aşağı"
                      >
                        <FaArrowDown className="text-xs" />
                      </button>
                      <div></div>
                    </div>
                  </div>

                  {/* Zoom Controls */}
                  <div className="flex flex-col gap-1.5 bg-white/90 dark:bg-zinc-900/90 p-1.5 rounded-xl shadow-lg backdrop-blur-md border border-stone-200/50 dark:border-zinc-700/50">
                    <button
                      onClick={() => zoomIn()}
                      className="p-2.5 bg-sky-500 hover:bg-sky-600 text-white rounded-lg transition-all active:scale-95"
                      title="Yakınlaştır"
                    >
                      <FaPlus className="text-sm" />
                    </button>
                    <button
                      onClick={() => zoomOut()}
                      className="p-2.5 bg-stone-100 hover:bg-stone-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-stone-700 dark:text-zinc-200 rounded-lg transition-all active:scale-95"
                      title="Uzaklaştır"
                    >
                      <FaMinus className="text-sm" />
                    </button>
                    <button
                      onClick={() => resetTransform()}
                      className="p-2.5 bg-stone-100 hover:bg-stone-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-stone-700 dark:text-zinc-200 rounded-lg transition-all active:scale-95"
                      title="Sıfırla"
                    >
                      <FaExpand className="text-sm" />
                    </button>
                  </div>
                </div>

                <TransformComponent
                  wrapperStyle={{
                    width: "100%",
                    height: "100%",
                    overflow: "hidden"
                  }}
                  contentStyle={{
                    width: "100%",
                    height: "100%",
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '1rem'
                  }}
                >
                  <TurkeyMap
                    visitedProvinces={visitedProvinces}
                    onProvinceClick={handleProvinceClick}
                    visitedColor="#0ea5e9"
                  />
                </TransformComponent>
              </>
            )}
          </TransformWrapper>
        </div>
      </div>
    </div>
  );
}