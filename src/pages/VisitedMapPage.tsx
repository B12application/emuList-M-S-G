// src/pages/VisitedMapPage.tsx
import { useState, useEffect, useRef, useCallback } from 'react';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebaseConfig';
import { doc, getDoc, updateDoc, arrayUnion, arrayRemove, setDoc } from 'firebase/firestore';
import { FaSpinner } from 'react-icons/fa';
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";
import { FaPlus, FaMinus, FaCompress } from "react-icons/fa6";

export default function VisitedMapPage() {
  const { isDark } = useTheme();
  const { user } = useAuth();
  const [visitedProvinces, setVisitedProvinces] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [tooltip, setTooltip] = useState<{ show: boolean; text: string; x: number; y: number }>({ show: false, text: '', x: 0, y: 0 });
  
  const svgObjectRef = useRef<HTMLObjectElement>(null); 
  const [isSvgLoaded, setIsSvgLoaded] = useState(false);
  const listenersRef = useRef<(() => void)[]>([]); 

  // Renkler
  const defaultColor = isDark ? "#374151" : "#E5E7EB"; 
  const visitedColor = "#10B981"; 
  const hoverColor = "#0ea5e9"; 
  const strokeColor = isDark ? "#1f2937" : "#FFFFFF"; 

  // Tıklama Fonksiyonu
  const handleProvinceClick = useCallback(async (provinceId: string) => {
    if (!user) return;
    const userDocRef = doc(db, 'users', user.uid);
    const isVisited = visitedProvinces.includes(provinceId);
    
    // Optimistik update
    setVisitedProvinces(prev => 
      isVisited ? prev.filter(p => p !== provinceId) : [...prev, provinceId]
    );

    try {
      if (isVisited) await updateDoc(userDocRef, { visitedProvinces: arrayRemove(provinceId) });
      else await updateDoc(userDocRef, { visitedProvinces: arrayUnion(provinceId) });
    } catch (e) { 
      console.error("Kaydetme hatası: ", e);
      setVisitedProvinces(visitedProvinces); // Hata olursa geri al
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

  // Boyama ve etkileşim kurma fonksiyonu
  const setupMapInteractions = useCallback(() => {
    if (!isSvgLoaded || !svgObjectRef.current) return;
    const svgDoc = svgObjectRef.current.contentDocument;
    if (!svgDoc) return; 

    // Önceki listener'ları temizle
    listenersRef.current.forEach(cleanup => cleanup());
    listenersRef.current = [];

    const paths = svgDoc.querySelectorAll('path[id^="TR"]');
    
    paths.forEach(path => {
      const svgPath = path as SVGPathElement;
      const provinceId = svgPath.id;
      const provinceName = svgPath.getAttribute('title') || svgPath.getAttribute('name') || provinceId;
      if (!provinceId || !provinceId.startsWith('TR')) return;

      const isVisited = visitedProvinces.includes(provinceId);
      const plateNumber = provinceId.replace('TR', '');
      const label = `${plateNumber} - ${provinceName}`;

      // Stiller
      svgPath.style.fill = isVisited ? visitedColor : defaultColor;
      svgPath.style.stroke = strokeColor;
      svgPath.style.cursor = "pointer";
      svgPath.style.transition = "fill 0.15s ease-in-out";

      // Olayları tanımla
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
      const handleClick = () => handleProvinceClick(provinceId);

      // Olayları Ekle
      svgPath.addEventListener('mouseenter', handleMouseEnter as EventListener);
      svgPath.addEventListener('mousemove', handleMouseMove as EventListener);
      svgPath.addEventListener('mouseleave', handleMouseLeave as EventListener);
      svgPath.addEventListener('click', handleClick as EventListener);

      // Temizleme listesine ekle
      listenersRef.current.push(() => {
        svgPath.removeEventListener('mouseenter', handleMouseEnter as EventListener);
        svgPath.removeEventListener('mousemove', handleMouseMove as EventListener);
        svgPath.removeEventListener('mouseleave', handleMouseLeave as EventListener);
        svgPath.removeEventListener('click', handleClick as EventListener);
      });
    });
  }, [isSvgLoaded, visitedProvinces, isDark, strokeColor, visitedColor, defaultColor, hoverColor, handleProvinceClick]);

  // Harita yüklendiğinde veya veriler değiştiğinde haritayı "boya"
  useEffect(() => {
    setupMapInteractions();
  }, [visitedProvinces, isDark, setupMapInteractions]);

  if (loading) {
    return (
      <div className="flex justify-center items-center p-8 mt-6">
        <FaSpinner className="animate-spin h-8 w-8 text-sky-500" />
        <span className="ml-3 text-lg">Harita Yükleniyor...</span>
      </div>
    );
  }

  return (
    <section className="py-6 relative">
      <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white mb-8">
        Ziyaret Ettiğim Yerler
      </h1>
      
      {/* Tooltip */}
      {tooltip.show && (
        <div 
          className="fixed z-50 px-3 py-1.5 bg-gray-800 text-white text-sm font-medium rounded shadow-xl pointer-events-none transform -translate-x-1/2 -translate-y-full -mt-4 whitespace-nowrap"
          style={{ top: tooltip.y, left: tooltip.x }}
        >
          {tooltip.text}
        </div>
      )}
      
      <p className="mb-4 text-gray-600 dark:text-gray-400">
        Ziyaret ettiğin ili seçmek için harita üzerinden tıkla.
      </p>

      {/* GÜNCELLENMİŞ ZOOM KOMPONENTİ */}
      <div className="w-full h-[70vh] border border-gray-300 dark:border-gray-700 rounded-lg overflow-hidden bg-white dark:bg-gray-800 relative">
        <TransformWrapper
          initialScale={1}
          minScale={0.5}
          maxScale={8}
          centerOnInit={true}
          wheel={{ step: 0.2 }}
          panning={{ 
            velocityDisabled: true,
            excluded: ['button', 'input', 'select', 'textarea'] 
          }}
          doubleClick={{ disabled: true }}
        >
          {({ zoomIn, zoomOut, resetTransform, centerView }) => (
            <>
              {/* Kontrol Butonları */}
              <div className="absolute bottom-4 right-4 z-10 flex flex-col gap-2">
                <button 
                  onClick={() => zoomIn()} 
                  className="p-3 bg-white dark:bg-gray-700 text-gray-700 dark:text-white rounded-lg shadow-md hover:bg-gray-100 dark:hover:bg-gray-600 transition border border-gray-200 dark:border-gray-600"
                  title="Yakınlaş"
                >
                  <FaPlus />
                </button>
                <button 
                  onClick={() => zoomOut()} 
                  className="p-3 bg-white dark:bg-gray-700 text-gray-700 dark:text-white rounded-lg shadow-md hover:bg-gray-100 dark:hover:bg-gray-600 transition border border-gray-200 dark:border-gray-600"
                  title="Uzaklaş"
                >
                  <FaMinus />
                </button>
                <button 
                  onClick={() => { resetTransform(); centerView(1); }} 
                  className="p-3 bg-white dark:bg-gray-700 text-gray-700 dark:text-white rounded-lg shadow-md hover:bg-gray-100 dark:hover:bg-gray-600 transition border border-gray-200 dark:border-gray-600"
                  title="Sıfırla"
                >
                  <FaCompress />
                </button>
              </div>

              {/* Harita Bileşeni - Geliştirilmiş Stil */}
              <TransformComponent
                wrapperStyle={{
                  width: "100%",
                  height: "100%",
                  cursor: "grab"
                }}
                contentStyle={{
                  width: "100%",
                  height: "100%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center"
                }}
              >
                <div className="flex items-center justify-center w-full h-full p-4">
                  <object
                    ref={svgObjectRef}
                    id="turkey-svg-map"
                    type="image/svg+xml"
                    data="/turkey-map.svg"
                    className="max-w-full max-h-full w-auto h-auto"
                    style={{ 
                      minWidth: "300px",
                      minHeight: "300px"
                    }}
                    onLoad={() => setIsSvgLoaded(true)}
                  >
                    <div className="text-center text-gray-500 dark:text-gray-400">
                      Harita yüklenemedi. Lütfen sayfayı yenileyin.
                    </div>
                  </object>
                </div>
              </TransformComponent>
            </>
          )}
        </TransformWrapper>
      </div>

      {/* Kullanım Talimatları */}
      <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg text-sm text-gray-600 dark:text-gray-400">
        <h3 className="font-medium mb-2">Kullanım Kılavuzu:</h3>
        <ul className="list-disc list-inside space-y-1">
          <li>Haritayı kaydırmak için <strong>tıklayıp sürükleyin</strong></li>
          <li>Yakınlaştırmak için <strong>mouse tekerleğini ileri itin</strong> veya <strong>+ butonuna tıklayın</strong></li>
          <li>Uzaklaştırmak için <strong>mouse tekerleğini geri çekin</strong> veya <strong>- butonuna tıklayın</strong></li>
          <li>Görünümü sıfırlamak için <strong>⤢ butonuna tıklayın</strong></li>
        </ul>
      </div>
    </section>
  );
}