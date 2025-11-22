// src/pages/VisitedMapPage.tsx
import { useState, useEffect, useRef, useCallback } from 'react';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebaseConfig';
import { doc, getDoc, updateDoc, arrayUnion, arrayRemove, setDoc } from 'firebase/firestore';
import { FaSpinner } from 'react-icons/fa';
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";
import { FaPlus, FaMinus, FaCompress } from "react-icons/fa6";

// Tooltip state type
interface TooltipState {
  show: boolean;
  text: string;
  x: number;
  y: number;
}

export default function VisitedMapPage() {
  const { isDark } = useTheme();
  const { user } = useAuth();
  const [visitedProvinces, setVisitedProvinces] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [tooltip, setTooltip] = useState<TooltipState>({ show: false, text: '', x: 0, y: 0 });
  
  const svgObjectRef = useRef<HTMLObjectElement>(null); 
  const [isSvgLoaded, setIsSvgLoaded] = useState(false);
  const listenersRef = useRef<(() => void)[]>([]); 

  // Renkler
  const defaultColor = isDark ? "#374151" : "#E5E7EB"; 
  const visitedColor = "#a62147"; 
  const hoverColor = "#000"; 
  const strokeColor = isDark ? "#1f2937" : "#FFFFFF"; 
  // 1. DÜZELTME: Yazı Rengi (Mobilde ve Koyu Modda daha iyi görünsün diye)
  const textColor = isDark ? "#FFFFFF" : "#333333"; 

  // Tıklama Fonksiyonu
  const handleProvinceClick = useCallback(async (provinceId: string) => {
    if (!user) return;
    const userDocRef = doc(db, 'users', user.uid);
    const isVisited = visitedProvinces.includes(provinceId);
    
    setVisitedProvinces(prev => 
      isVisited ? prev.filter(p => p !== provinceId) : [...prev, provinceId]
    );

    try {
      if (isVisited) await updateDoc(userDocRef, { visitedProvinces: arrayRemove(provinceId) });
      else await updateDoc(userDocRef, { visitedProvinces: arrayUnion(provinceId) });
    } catch (e) { 
      console.error("Kaydetme hatası: ", e);
      setVisitedProvinces(visitedProvinces);
    }
  }, [user, visitedProvinces]); 

  // Firebase'den veri çekme
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

  // Harita Etkileşimleri
  const setupMapInteractions = useCallback(() => {
    if (!isSvgLoaded || !svgObjectRef.current) return;
    const svgDoc = svgObjectRef.current.contentDocument;
    if (!svgDoc) return; 

    listenersRef.current.forEach(cleanup => cleanup());
    listenersRef.current = [];

    // Eski etiketleri temizle
    const oldLabels = svgDoc.querySelectorAll('.province-label');
    oldLabels.forEach(label => label.remove());

    const paths = svgDoc.querySelectorAll('path[id^="TR"]');
    
    paths.forEach(path => {
      const svgPath = path as SVGPathElement;
      const provinceId = svgPath.id;
      const provinceName = svgPath.getAttribute('title') || svgPath.getAttribute('name') || provinceId;
      if (!provinceId || !provinceId.startsWith('TR')) return;

      const isVisited = visitedProvinces.includes(provinceId);
      const plateNumber = provinceId.replace('TR', '');
      const label = `${plateNumber} - ${provinceName}`;

      svgPath.style.fill = isVisited ? visitedColor : defaultColor;
      svgPath.style.stroke = strokeColor;
      svgPath.style.strokeWidth = "0.5";
      svgPath.style.cursor = "pointer";
      svgPath.style.transition = "fill 0.15s ease-in-out";
      svgPath.style.touchAction = "manipulation"; 

      // İsimleri Yaz (Ziyaret edilenler için)
      if (isVisited) {
        const bbox = (svgPath as SVGGraphicsElement).getBBox();
        const centerX = bbox.x + bbox.width / 2;
        const centerY = bbox.y + bbox.height / 2;

        const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
        text.setAttribute("x", String(centerX));
        text.setAttribute("y", String(centerY));
        text.setAttribute("class", "province-label"); 
        text.setAttribute("text-anchor", "middle"); 
        text.setAttribute("dominant-baseline", "middle"); 
        // 2. DÜZELTME: Yazı boyutu ve stili
        text.setAttribute("font-size", "14px"); // Biraz daha büyük
        text.setAttribute("font-family", "sans-serif");
        text.setAttribute("font-weight", "bold");
        text.setAttribute("fill", textColor); // Beyaz veya Koyu Gri
        // Yazıya gölge (stroke) ekleyerek okunabilirliği artır
        text.setAttribute("stroke", isDark ? "#000" : "#FFF");
        text.setAttribute("stroke-width", "0.5px");
        text.setAttribute("paint-order", "stroke");
        text.setAttribute("pointer-events", "none"); 
        text.textContent = provinceName;

        if (svgPath.parentNode) {
          svgPath.parentNode.appendChild(text);
        }
      }

      const handleMouseEnter = (e: MouseEvent) => {
        svgPath.style.fill = hoverColor;
        setTooltip(() => ({ show: true, text: label, x: e.clientX, y: e.clientY }));
      };
      const handleMouseMove = (e: MouseEvent) => {
        setTooltip(prev => ({ ...prev, x: e.clientX, y: e.clientY }));
      };
      const handleMouseLeave = () => {
        const isCurrentlyVisited = visitedProvinces.includes(provinceId);
        svgPath.style.fill = isCurrentlyVisited ? visitedColor : defaultColor;
        setTooltip(prev => ({ ...prev, show: false }));
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
  }, [isSvgLoaded, visitedProvinces, isDark, strokeColor, visitedColor, defaultColor, hoverColor, handleProvinceClick, textColor]);

  useEffect(() => {
    if (isSvgLoaded) {
      setupMapInteractions();
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
        <span className="ml-3 text-lg">Harita Yükleniyor...</span>
      </div>
    );
  }

  return (
    <section className="py-6 relative h-[calc(100vh-100px)] flex flex-col">
      <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white mb-4">
        Ziyaret Ettiğim Yerler
      </h1>
      
      {tooltip.show && (
        <div 
          className="fixed z-[9999] px-3 py-2 text-sm font-bold text-white bg-gray-900 dark:bg-gray-700 rounded-lg shadow-xl pointer-events-none transform -translate-x-1/2 -translate-y-[130%]"
          style={{ left: tooltip.x, top: tooltip.y }}
        >
          {tooltip.text}
        </div>
      )}
      
      <p className="mb-4 text-gray-600 dark:text-gray-400 text-sm sm:text-base">
        Ziyaret ettiğin ili seçmek için harita üzerinden tıkla.
      </p>

      {/* 3. DÜZELTME: Mobil Uyumlu Konteyner */}
      <div className="flex-1 w-full border border-gray-300 dark:border-gray-700 rounded-lg overflow-hidden bg-white dark:bg-gray-800 relative touch-none">
        <TransformWrapper
          initialScale={1}
          minScale={0.5}
          maxScale={15}
          centerOnInit={true}
          wheel={{ step: 0.1 }} 
          panning={{ 
            velocityDisabled: false, 
            excluded: [] 
          }}
          pinch={{ disabled: false }}
          doubleClick={{ disabled: true }}
        >
          {({ zoomIn, zoomOut, resetTransform, centerView }) => (
            <>
              <div className="absolute bottom-4 right-4 z-10 flex flex-col gap-2">
                <button onClick={() => zoomIn()} className="p-3 bg-white dark:bg-gray-700 text-gray-700 dark:text-white rounded-lg shadow-md hover:bg-gray-100 dark:hover:bg-gray-600 transition border border-gray-200 dark:border-gray-600"><FaPlus /></button>
                <button onClick={() => zoomOut()} className="p-3 bg-white dark:bg-gray-700 text-gray-700 dark:text-white rounded-lg shadow-md hover:bg-gray-100 dark:hover:bg-gray-600 transition border border-gray-200 dark:border-gray-600"><FaMinus /></button>
                <button onClick={() => { resetTransform(); centerView(1); }} className="p-3 bg-white dark:bg-gray-700 text-gray-700 dark:text-white rounded-lg shadow-md hover:bg-gray-100 dark:hover:bg-gray-600 transition border border-gray-200 dark:border-gray-600"><FaCompress /></button>
              </div>

              <TransformComponent
                wrapperStyle={{
                  width: "100%",
                  height: "100%",
                  cursor: "grab",
                  touchAction: "none"
                }}
                contentStyle={{
                  width: "100%",
                  height: "100%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center"
                }}
              >
                {/* 4. DÜZELTME: Mobilde taşmayı önleyen stil */}
                <div className="w-full h-full flex items-center justify-center p-2">
                    <object
                    ref={svgObjectRef}
                    id="turkey-svg-map"
                    type="image/svg+xml"
                    data="/turkey-map.svg"
                    className="max-w-full max-h-full object-contain pointer-events-auto" 
                    style={{ 
                        maxWidth: "100%", 
                        maxHeight: "100%",
                        // Mobilde çok küçük kalmaması için min boyut
                        minWidth: "300px" 
                    }}
                    onLoad={() => setIsSvgLoaded(true)}
                    >
                    Harita yüklenemedi.
                    </object>
                </div>
              </TransformComponent>
            </>
          )}
        </TransformWrapper>
      </div>
    </section>
  );
}