import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { db } from '../../backend/config/firebaseConfig';
import { doc, getDoc, updateDoc, arrayUnion, arrayRemove, setDoc } from 'firebase/firestore';
import { FaSpinner } from 'react-icons/fa';
import { TransformWrapper, TransformComponent, type ReactZoomPanPinchRef } from "react-zoom-pan-pinch";
import { FaPlus, FaMinus, FaExpand, FaArrowUp, FaArrowDown, FaArrowLeft, FaArrowRight } from "react-icons/fa6";
import { useLanguage } from '../context/LanguageContext';
import toast from 'react-hot-toast';
import TurkeyMap from '../components/TurkeyMap';
import React from 'react';

export default function VisitedMapPage() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [visitedProvinces, setVisitedProvinces] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  // Track transform state for pan controls
  const [transformState, setTransformState] = useState({ positionX: 0, positionY: 0, scale: 1 });
  const transformRef = React.useRef<ReactZoomPanPinchRef>(null);

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
        toast.success(t('Haritadan kaldırıldı'), { duration: 3000 }); // Consider using translation key or direct text
      } else {
        await updateDoc(userDocRef, { visitedProvinces: arrayUnion(provinceId) });
        toast.success(t('Haritaya eklendi'), { duration: 3000 }); // Consider using translation key or direct text
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
      <div className="flex justify-center items-center p-8 mt-6">
        <FaSpinner className="animate-spin h-8 w-8 text-sky-500" />
        <span className="ml-3 text-lg">{t('mapPage.loading')}</span>
      </div>
    );
  }

  return (
    <section className="py-2 md:py-6 relative h-[calc(100dvh-80px)] md:h-[calc(100vh-100px)] flex flex-col px-2 md:px-0">
      <h1 className="text-xl md:text-3xl font-bold tracking-tight text-gray-900 dark:text-white mb-2 md:mb-4 px-2">
        {t('mapPage.title')}
      </h1>

      <div className="mb-2 md:mb-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 md:gap-3 px-2">
        {/* Hide instructions on small screens to save space */}
        <p className="hidden md:block text-gray-600 dark:text-gray-400 text-sm sm:text-base">
          {t('mapPage.instructions')}
        </p>

        {/* Mobile Instructions - Simplified */}
        <p className="md:hidden text-xs text-gray-500 dark:text-gray-400">
          Yakınlaştırmak için parmaklarını kullan. Seçmek için dokun.
        </p>

        {/* City Counter */}
        <div className="flex items-center gap-4 md:gap-6 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm px-4 py-2 md:px-6 md:py-3 rounded-xl shadow-sm w-full md:w-auto justify-between md:justify-start">
          <div className="flex items-baseline gap-2">
            <div className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
              {visitedProvinces.length}
            </div>
            <div className="text-xs md:text-sm text-gray-500 dark:text-gray-400">/ 81 {t('mapPage.cities')}</div>
          </div>
          <div className="text-xs md:text-sm text-gray-600 dark:text-gray-300 font-medium">
            {t('mapPage.visited')}
          </div>
        </div>
      </div>

      {/* Map Container - Full View Fix */}
      <div className="flex-1 w-full border border-gray-300 dark:border-gray-700 rounded-lg overflow-hidden bg-white dark:bg-gray-800 relative z-0 shadow-inner">
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
              <div className="absolute bottom-4 right-4 z-10 flex flex-col gap-3 pointer-events-none">
                {/* Pan Controls - D-Pad style hidden on mobile */}
                <div className="hidden md:block pointer-events-auto bg-white/90 dark:bg-gray-900/90 p-2.5 rounded-xl shadow-lg backdrop-blur-md border border-gray-200/50 dark:border-gray-700/50">
                  <div className="grid grid-cols-3 grid-rows-3 gap-1.5">
                    <div></div>
                    <button
                      onClick={() => setTransform(transformState.positionX, transformState.positionY - 50, transformState.scale)}
                      className="p-2.5 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-lg shadow-sm transition-all duration-200 hover:shadow-md active:scale-95"
                      title={t('mapPage.controls.up')}
                    >
                      <FaArrowUp className="text-sm" />
                    </button>
                    <div></div>
                    <button
                      onClick={() => setTransform(transformState.positionX - 50, transformState.positionY, transformState.scale)}
                      className="p-2.5 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-lg shadow-sm transition-all duration-200 hover:shadow-md active:scale-95"
                      title={t('mapPage.controls.left')}
                    >
                      <FaArrowLeft className="text-sm" />
                    </button>
                    <div className="bg-gray-50 dark:bg-gray-800 rounded-lg flex items-center justify-center border border-gray-200 dark:border-gray-700">
                      <div className="w-1.5 h-1.5 rounded-full bg-gray-300 dark:bg-gray-600"></div>
                    </div>
                    <button
                      onClick={() => setTransform(transformState.positionX + 50, transformState.positionY, transformState.scale)}
                      className="p-2.5 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-lg shadow-sm transition-all duration-200 hover:shadow-md active:scale-95"
                      title={t('mapPage.controls.right')}
                    >
                      <FaArrowRight className="text-sm" />
                    </button>
                    <div></div>
                    <button
                      onClick={() => setTransform(transformState.positionX, transformState.positionY + 50, transformState.scale)}
                      className="p-2.5 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-lg shadow-sm transition-all duration-200 hover:shadow-md active:scale-95"
                      title={t('mapPage.controls.down')}
                    >
                      <FaArrowDown className="text-sm" />
                    </button>
                    <div></div>
                  </div>
                </div>

                {/* Zoom Controls */}
                <div className="pointer-events-auto flex flex-col gap-2 bg-white/90 dark:bg-gray-900/90 p-2 rounded-xl shadow-lg backdrop-blur-md border border-gray-200/50 dark:border-gray-700/50">
                  <button
                    onClick={() => zoomIn()}
                    className="p-3 bg-sky-500 hover:bg-sky-600 dark:bg-sky-600 dark:hover:bg-sky-500 text-white rounded-lg shadow-sm transition-all duration-200 hover:shadow-md active:scale-95 touch-manipulation"
                    title={t('mapPage.controls.zoomIn')}
                  >
                    <FaPlus className="text-sm" />
                  </button>
                  <button
                    onClick={() => zoomOut()}
                    className="p-3 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-lg shadow-sm transition-all duration-200 hover:shadow-md active:scale-95 touch-manipulation"
                    title={t('mapPage.controls.zoomOut')}
                  >
                    <FaMinus className="text-sm" />
                  </button>
                  <button
                    onClick={() => resetTransform()}
                    className="p-3 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-lg shadow-sm transition-all duration-200 hover:shadow-md active:scale-95 touch-manipulation"
                    title={t('mapPage.controls.reset')}
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
                  visitedColor="#FF0000"
                />
              </TransformComponent>
            </>
          )}
        </TransformWrapper>
      </div>
    </section>
  );
}