// src/pages/VisitedMapPage.tsx
import { useState, useEffect, useRef, useCallback, memo } from 'react';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebaseConfig';
import { doc, getDoc, updateDoc, arrayUnion, arrayRemove, setDoc } from 'firebase/firestore';
import { FaSpinner } from 'react-icons/fa';

// === 1. İZOLE EDİLMİŞ HARİTA BİLEŞENİ ===
// Bu bileşen, Tooltip (mouse) hareket ettiğinde YENİLENMEZ (Re-render olmaz).
// Bu sayede harita bozulmaz.
const TurkeyMap = memo(({ 
  svgContent, 
  visitedProvinces, 
  isDark,
  onProvinceClick, 
  onProvinceHover, 
  onProvinceLeave 
}: { 
  svgContent: string, 
  visitedProvinces: string[], 
  isDark: boolean,
  onProvinceClick: (id: string) => void,
  onProvinceHover: (e: MouseEvent, label: string) => void,
  onProvinceLeave: () => void
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  // Renkler
  const defaultColor = isDark ? "#374151" : "#E5E7EB"; 
  const visitedColor = "#10B981"; 
  const hoverColor = "#0ea5e9"; 
  const strokeColor = isDark ? "#1f2937" : "#FFFFFF";

  // Haritayı Boyama ve Olayları Ekleme
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const paths = container.querySelectorAll('path');

    paths.forEach((path) => {
      // ID Kontrolü ve Düzeltme (TR-34 -> TR34 gibi uyumsuzlukları önlemek için)
      // SVG'den gelen ID'deki tireyi (-) kaldırıyoruz ki veritabanı ile eşleşsin.
      const rawId = path.id; 
      if (!rawId || !rawId.startsWith('TR')) return;
      
      // Veritabanı formatına (TR34) çevir
      const provinceId = rawId.replace('-', ''); 
      
      const provinceName = path.getAttribute('title') || path.getAttribute('name') || provinceId;
      const plateNumber = provinceId.replace('TR', '');
      const label = `${plateNumber} - ${provinceName}`;

      const isVisited = visitedProvinces.includes(provinceId);

      // Stilleri Doğrudan Uygula
      path.style.fill = isVisited ? visitedColor : defaultColor;
      path.style.stroke = strokeColor;
      path.style.strokeWidth = "1";
      path.style.cursor = "pointer";
      path.style.transition = "fill 0.2s ease";

      // Önceki event listener'ları temizle (Çakışmayı önler)
      path.onclick = null;
      path.onmouseenter = null;
      path.onmouseleave = null;
      path.onmousemove = null;

      // Yeni Eventleri Ekle
      path.onmouseenter = (e: any) => {
        path.style.fill = hoverColor;
        onProvinceHover(e, label);
      };
      
      path.onmousemove = (e: any) => {
         // Mouse hareketini üst bileşene ilet
         onProvinceHover(e, label);
      };

      path.onmouseleave = () => {
        path.style.fill = visitedProvinces.includes(provinceId) ? visitedColor : defaultColor;
        onProvinceLeave();
      };

      path.onclick = () => {
        onProvinceClick(provinceId);
      };
    });
  }, [svgContent, visitedProvinces, isDark, defaultColor, visitedColor, hoverColor, strokeColor, onProvinceClick, onProvinceHover, onProvinceLeave]);

  return (
    <div 
      ref={containerRef}
      className="w-full h-full flex justify-center"
      dangerouslySetInnerHTML={{ __html: svgContent }} 
    />
  );
});


// === 2. ANA SAYFA BİLEŞENİ ===
export default function VisitedMapPage() {
  const { isDark } = useTheme();
  const { user } = useAuth();
  const [visitedProvinces, setVisitedProvinces] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [svgContent, setSvgContent] = useState<string | null>(null);
  
  // Tooltip state'i (Sadece bu değişecek, harita değil)
  const [tooltip, setTooltip] = useState({ show: false, text: '', x: 0, y: 0 });

  // SVG Dosyasını Çek
  useEffect(() => {
    fetch('/turkey-map.svg')
      .then(res => res.text())
      .then(text => setSvgContent(text))
      .catch(err => console.error("SVG yüklenemedi:", err));
  }, []);

  // Firebase Verisi Çek
  useEffect(() => {
    if (!user) { setLoading(false); return; }
    const fetchVisited = async () => {
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
    fetchVisited();
  }, [user]);

  // Tıklama Mantığı (Callback ile sabitlendi)
  const handleProvinceClick = useCallback(async (provinceId: string) => {
    if (!user) return;
    const userDocRef = doc(db, 'users', user.uid);
    
    // Güncel state'i al (prev kullanarak)
    setVisitedProvinces(prev => {
      const isVisited = prev.includes(provinceId);
      const newVisited = isVisited 
        ? prev.filter(p => p !== provinceId) 
        : [...prev, provinceId];
      
      // Firebase güncellemesi (State güncellemesinin yan etkisi olarak)
      (async () => {
        try {
          if (isVisited) await updateDoc(userDocRef, { visitedProvinces: arrayRemove(provinceId) });
          else await updateDoc(userDocRef, { visitedProvinces: arrayUnion(provinceId) });
        } catch (e) { console.error("Kaydetme hatası", e); }
      })();

      return newVisited;
    });
  }, [user]);

  // Tooltip Yönetimi
  const handleHover = useCallback((e: MouseEvent, text: string) => {
    setTooltip({ show: true, text, x: e.clientX, y: e.clientY });
  }, []);

  const handleLeave = useCallback(() => {
    setTooltip(prev => ({ ...prev, show: false }));
  }, []);


  if (loading || !svgContent) {
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
      
      {/* Tooltip (Haritadan bağımsız, üst katmanda) */}
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

      <div className="w-full h-auto border border-gray-300 dark:border-gray-700 rounded-lg overflow-hidden bg-white dark:bg-gray-800 p-4">
        
        {/* İzole Harita Bileşeni */}
        <TurkeyMap 
          svgContent={svgContent}
          visitedProvinces={visitedProvinces}
          isDark={isDark}
          onProvinceClick={handleProvinceClick}
          onProvinceHover={handleHover}
          onProvinceLeave={handleLeave}
        />

      </div>
    </section>
  );
}