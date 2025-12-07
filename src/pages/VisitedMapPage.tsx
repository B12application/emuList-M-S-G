// src/pages/VisitedMapPage.tsx
import { useState, useEffect, useRef, useCallback } from 'react';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebaseConfig';
import { doc, getDoc, updateDoc, arrayUnion, arrayRemove, setDoc } from 'firebase/firestore';
import { FaSpinner } from 'react-icons/fa';
import { TransformWrapper, TransformComponent, type ReactZoomPanPinchRef } from "react-zoom-pan-pinch";
import { FaPlus, FaMinus, FaExpand, FaArrowUp, FaArrowDown, FaArrowLeft, FaArrowRight } from "react-icons/fa6";
import { useLanguage } from '../context/LanguageContext';

export default function VisitedMapPage() {
  const { isDark } = useTheme();
  const { user } = useAuth();
  const { t } = useLanguage();
  const [visitedProvinces, setVisitedProvinces] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const svgObjectRef = useRef<HTMLObjectElement>(null);
  const [isSvgLoaded, setIsSvgLoaded] = useState(false);
  const listenersRef = useRef<(() => void)[]>([]);
  const transformRef = useRef<ReactZoomPanPinchRef>(null);

  // Track transform state for pan controls
  const [transformState, setTransformState] = useState({ positionX: 0, positionY: 0, scale: 1 });

  // Modern Color Palette
  const defaultColor = isDark ? "#374151" : "#E5E7EB";
  const visitedColor = isDark ? "#dc2626" : "#b91c1c";
  const hoverColor = isDark ? "#f59e0b" : "#f97316";
  const strokeColor = "transparent";
  const textColor = isDark ? "#FFFFFF" : "#1f2937";
  const glowColor = isDark ? "rgba(220, 38, 38, 0.6)" : "rgba(185, 28, 28, 0.4)";

  const handleProvinceClick = useCallback(async (provinceId: string) => {
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

      if (isVisited) await updateDoc(userDocRef, { visitedProvinces: arrayRemove(provinceId) });
      else await updateDoc(userDocRef, { visitedProvinces: arrayUnion(provinceId) });
    } catch (e) {
      console.error("Kaydetme hatası: ", e);
      setVisitedProvinces(visitedProvinces);
    }
  }, [user, visitedProvinces]);

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

  const setupMapInteractions = useCallback(() => {
    if (!isSvgLoaded || !svgObjectRef.current) return;
    const svgDoc = svgObjectRef.current.contentDocument;
    if (!svgDoc) return;

    listenersRef.current.forEach(cleanup => cleanup());
    listenersRef.current = [];

    const oldLabels = svgDoc.querySelectorAll('.province-label');
    oldLabels.forEach(label => label.remove());

    const paths = svgDoc.querySelectorAll('path[id^="TR"]');

    paths.forEach(path => {
      const svgPath = path as SVGPathElement;
      const provinceId = svgPath.id;
      const provinceName = svgPath.getAttribute('title') || svgPath.getAttribute('name') || provinceId;
      if (!provinceId || !provinceId.startsWith('TR')) return;

      const isVisited = visitedProvinces.includes(provinceId);

      svgPath.style.fill = isVisited ? visitedColor : defaultColor;
      svgPath.style.stroke = strokeColor;
      svgPath.style.strokeWidth = "0.5";
      svgPath.style.cursor = "pointer";
      svgPath.style.transition = "fill 0.15s ease-in-out";
      svgPath.style.touchAction = "manipulation";
      svgPath.style.pointerEvents = "auto";

      const bbox = (svgPath as SVGGraphicsElement).getBBox();
      const centerX = bbox.x + bbox.width / 2;
      const centerY = bbox.y + bbox.height / 2;

      const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
      text.setAttribute("x", String(centerX));
      text.setAttribute("y", String(centerY));
      text.setAttribute("class", "province-label");
      text.setAttribute("text-anchor", "middle");
      text.setAttribute("dominant-baseline", "middle");
      text.setAttribute("font-size", "11px");
      text.setAttribute("font-family", "'Inter', 'Segoe UI', sans-serif");
      text.setAttribute("font-weight", "700");
      text.setAttribute("fill", "#000000");
      text.setAttribute("pointer-events", "none");
      text.textContent = provinceName;

      if (svgPath.parentNode) {
        svgPath.parentNode.appendChild(text);
      }

      const handleMouseEnter = () => {
        svgPath.style.fill = hoverColor;
        svgPath.style.transform = "scale(1.02)";
        svgPath.style.transformOrigin = "center";
        svgPath.style.filter = `drop-shadow(0 4px 12px ${glowColor})`;
      };
      // eslint-disable-next-line @typescript-eslint/no-empty-function
      const handleMouseMove = () => { };
      const handleMouseLeave = () => {
        const isCurrentlyVisited = visitedProvinces.includes(provinceId);
        svgPath.style.fill = isCurrentlyVisited ? visitedColor : defaultColor;
        svgPath.style.transform = "scale(1)";
        svgPath.style.filter = isCurrentlyVisited ? "drop-shadow(0 2px 4px rgba(0,0,0,0.2))" : "drop-shadow(0 1px 2px rgba(0,0,0,0.1))";
      };
      const handleClick = (e: Event) => {
        e.preventDefault();
        handleProvinceClick(provinceId);
      };

      svgPath.addEventListener('mouseenter', handleMouseEnter as EventListener);
      svgPath.addEventListener('mousemove', handleMouseMove as EventListener);
      svgPath.addEventListener('mouseleave', handleMouseLeave as EventListener);
      svgPath.addEventListener('click', handleClick as EventListener);
      svgPath.addEventListener('touchend', handleClick as EventListener);

      listenersRef.current.push(() => {
        svgPath.removeEventListener('mouseenter', handleMouseEnter as EventListener);
        svgPath.removeEventListener('mousemove', handleMouseMove as EventListener);
        svgPath.removeEventListener('mouseleave', handleMouseLeave as EventListener);
        svgPath.removeEventListener('click', handleClick as EventListener);
        svgPath.removeEventListener('touchend', handleClick as EventListener);
      });
    });
  }, [isSvgLoaded, visitedProvinces, isDark, strokeColor, visitedColor, defaultColor, hoverColor, handleProvinceClick, textColor, glowColor]);

  useEffect(() => {
    if (isSvgLoaded) {
      setupMapInteractions();
      // Force recenter after SVG load for better initial positioning
      setTimeout(() => {
        if (transformRef.current) {
          transformRef.current.resetTransform();
        }
      }, 100);
    }
  }, [isSvgLoaded, setupMapInteractions]);

  useEffect(() => {
    return () => {
      listenersRef.current.forEach(cleanup => cleanup());
    };
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center p-8 mt-6">
        <FaSpinner className="animate-spin h-8 w-8 text-sky-500" />
        <span className="ml-3 text-lg">{t('mapPage.loading')}</span>
      </div>
    );
  }

  return (
    <section className="py-6 relative h-[calc(100vh-100px)] flex flex-col">
      <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white mb-4">
        {t('mapPage.title')}
      </h1>

      <div className="mb-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <p className="text-gray-600 dark:text-gray-400 text-sm sm:text-base">
          {t('mapPage.instructions')}
        </p>

        {/* City Counter */}
        <div className="flex items-center gap-6 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm px-6 py-3 rounded-xl shadow-sm">
          <div className="flex items-baseline gap-2">
            <div className="text-3xl font-bold text-gray-900 dark:text-white">
              {visitedProvinces.length}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">/ 81 {t('mapPage.cities')}</div>
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-300 font-medium">
            {t('mapPage.visited')}
          </div>
        </div>
      </div>

      {/* Map Container - Button Controlled */}
      <div className="flex-1 w-full border border-gray-300 dark:border-gray-700 rounded-lg overflow-hidden bg-white dark:bg-gray-800 relative">
        <TransformWrapper
          ref={transformRef}
          initialScale={1.1}
          minScale={0.5}
          maxScale={8}
          centerOnInit={true}
          limitToBounds={false}
          onTransformed={(_ref, state) => setTransformState({ positionX: state.positionX, positionY: state.positionY, scale: state.scale })}
        >
          {({ zoomIn, zoomOut, resetTransform, setTransform }) => (
            <>
              {/* Control Panel */}
              <div className="absolute bottom-4 right-4 z-10 flex gap-3">
                {/* Pan Controls - D-Pad Style */}
                <div className="bg-white/90 dark:bg-gray-900/90 p-2.5 rounded-xl shadow-lg backdrop-blur-md border border-gray-200/50 dark:border-gray-700/50">
                  <div className="grid grid-cols-3 grid-rows-3 gap-1.5">
                    {/* Top row */}
                    <div></div>
                    <button
                      onClick={() => setTransform(transformState.positionX, transformState.positionY - 50, transformState.scale)}
                      className="p-2.5 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-lg shadow-sm transition-all duration-200 hover:shadow-md active:scale-95"
                      title={t('mapPage.controls.up')}
                    >
                      <FaArrowUp className="text-sm" />
                    </button>
                    <div></div>

                    {/* Middle row */}
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

                    {/* Bottom row */}
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
                <div className="flex flex-col gap-2 bg-white/90 dark:bg-gray-900/90 p-2.5 rounded-xl shadow-lg backdrop-blur-md border border-gray-200/50 dark:border-gray-700/50">
                  <button
                    onClick={() => zoomIn()}
                    className="p-3 bg-sky-500 hover:bg-sky-600 dark:bg-sky-600 dark:hover:bg-sky-500 text-white rounded-lg shadow-sm transition-all duration-200 hover:shadow-md active:scale-95"
                    title={t('mapPage.controls.zoomIn')}
                  >
                    <FaPlus className="text-sm" />
                  </button>
                  <button
                    onClick={() => zoomOut()}
                    className="p-3 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-lg shadow-sm transition-all duration-200 hover:shadow-md active:scale-95"
                    title={t('mapPage.controls.zoomOut')}
                  >
                    <FaMinus className="text-sm" />
                  </button>
                  <button
                    onClick={() => resetTransform()}
                    className="p-3 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-lg shadow-sm transition-all duration-200 hover:shadow-md active:scale-95"
                    title={t('mapPage.controls.reset')}
                  >
                    <FaExpand className="text-sm" />
                  </button>
                </div>
              </div>

              <TransformComponent
                wrapperStyle={{
                  width: "100%",
                  height: "100%"
                }}
                contentStyle={{
                  width: "100%",
                  height: "100%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center"
                }}
              >
                <div className="w-full h-full flex items-center justify-center p-2">
                  <object
                    ref={svgObjectRef}
                    id="turkey-svg-map"
                    type="image/svg+xml"
                    data="/turkey-map.svg"
                    className="max-w-full max-h-full object-contain pointer-events-auto"
                    style={{
                      width: "100%",
                      height: "100%",
                      minWidth: "280px"
                    }}
                    onLoad={() => setIsSvgLoaded(true)}
                  >
                    {t('mapPage.error')}
                  </object >
                </div >
              </TransformComponent >
            </>
          )}
        </TransformWrapper >
      </div >
    </section >
  );
}