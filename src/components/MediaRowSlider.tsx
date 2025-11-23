// src/components/MediaRowSlider.tsx
import { useState } from 'react';
import type { MediaItem } from '../types/media';
import MediaCard from './MediaCard';
import { FaChevronLeft, FaChevronRight } from 'react-icons/fa';

interface MediaRowSliderProps {
  items: MediaItem[]; 
  refetch: () => void;
  rowIndex: number; // Bu prop zorunlu
}

export default function MediaRowSlider({ items, refetch }: MediaRowSliderProps) {
  const [slideIndex, setSlideIndex] = useState(0);

  // 4'lü gruplar halinde sayfa sayısı
  const maxIndex = Math.ceil(items.length / 4) - 1;

  const handlePrev = () => {
    setSlideIndex(prev => Math.max(prev - 1, 0));
  };

  const handleNext = () => {
    setSlideIndex(prev => Math.min(prev + 1, maxIndex));
  };

  const visibleItems = items.slice(slideIndex * 4, (slideIndex + 1) * 4);

  if (items.length === 0) return null;

  return (
    <div className="relative py-4 group/row">
      
      {/* SOL OK */}
      {slideIndex > 0 && (
        <button 
          onClick={handlePrev}
          // Renkler 'sky' yapıldı
          className="absolute left-0 top-1/2 -translate-y-1/2 z-20 p-3 rounded-full bg-black/50 text-white hover:bg-sky-600 transition-all backdrop-blur-sm shadow-lg -translate-x-1/2 opacity-0 group-hover/row:opacity-100 group-hover/row:translate-x-2"
        >
          <FaChevronLeft />
        </button>
      )}

      {/* KARTLAR */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 px-2 transition-all duration-500 ease-in-out">
        {visibleItems.map((item) => (
          <div key={item.id} className="animate-fadeIn">
            <MediaCard item={item} refetch={refetch} />
          </div>
        ))}
        
        {/* Boşlukları doldur (Hizalama bozulmasın) */}
        {visibleItems.length < 4 && Array.from({ length: 4 - visibleItems.length }).map((_, i) => (
             <div key={`empty-${i}`} className="hidden lg:block" />
        ))}
      </div>

      {/* SAĞ OK */}
      {slideIndex < maxIndex && (
        <button 
          onClick={handleNext}
          // Renkler 'sky' yapıldı
          className="absolute right-0 top-1/2 -translate-y-1/2 z-20 p-3 rounded-full bg-black/50 text-white hover:bg-sky-600 transition-all backdrop-blur-sm shadow-lg translate-x-1/2 opacity-0 group-hover/row:opacity-100 group-hover/row:-translate-x-2"
        >
          <FaChevronRight />
        </button>
      )}

      {/* Sayfa Göstergesi (Çizgiler) */}
      {items.length > 4 && (
        <div className="absolute top-0 right-4 flex gap-1">
          {Array.from({ length: maxIndex + 1 }).map((_, i) => (
            <div 
              key={i} 
              // Aktif çizgi rengi 'sky' yapıldı
              className={`h-1 w-6 rounded-full transition-colors ${i === slideIndex ? 'bg-sky-500' : 'bg-gray-300 dark:bg-gray-700'}`} 
            />
          ))}
        </div>
      )}
    </div>
  );
}