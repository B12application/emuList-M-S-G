// src/components/RecommendationCard.tsx
import { Fragment } from 'react';
import type { MediaItem } from '../types/media';
import { FaStar, FaFilm, FaTv, FaGamepad } from 'react-icons/fa';
import { Popover, Transition } from '@headlessui/react';
import MediaCard from './MediaCard';
import ImageWithFallback from './ui/ImageWithFallback';

interface RecCardProps {
  item: MediaItem | undefined;
  typeLabel: string;
  refetch: () => void;
}

export default function RecommendationCard({ item, typeLabel, refetch }: RecCardProps) {
  
  // Türe göre ikon seçimi
  const getIcon = () => {
    if (typeLabel === 'Film') return <FaFilm className="text-sky-500" />;
    if (typeLabel === 'Dizi') return <FaTv className="text-emerald-500" />;
    return <FaGamepad className="text-amber-500" />;
  };

  // Eğer öneri yoksa (boş kutu)
  if (!item) {
    return (
      <div className="flex flex-col justify-center items-center gap-4 p-8 bg-white dark:bg-gray-800 rounded-3xl shadow-lg border border-gray-100 dark:border-gray-700 h-full text-center opacity-60">
        <div className="p-4 bg-gray-100 dark:bg-gray-700 rounded-full text-3xl text-gray-400">
          {getIcon()}
        </div>
        <div>
          <h4 className="font-bold text-lg text-gray-900 dark:text-white">{typeLabel}</h4>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Bu kategoride izlenmeyen öneri kalmadı.
          </p>
        </div>
      </div>
    );
  }

  return (
    <Popover className="relative h-full">
      {({ open }) => (
        <>
          <Popover.Button as="div" className="outline-none h-full">
            <div 
              className={`group relative flex flex-col bg-white dark:bg-gray-800 rounded-3xl shadow-lg border border-gray-100 dark:border-gray-700 h-full cursor-pointer transition-all duration-300 transform hover:-translate-y-1 hover:shadow-xl ${open ? 'ring-2 ring-sky-500' : ''}`}
            >
              {/* 1. DÜZELTME: Resim Alanı Sabitlendi */}
              <div className="relative h-64 w-full overflow-hidden rounded-t-3xl bg-gray-100 dark:bg-gray-900">
                <ImageWithFallback 
                  src={item.image} 
                  alt={item.title} 
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
                />
                
                {/* Üstteki Etiketler */}
                <div className="absolute top-3 left-3 flex gap-2">
                   <span className="px-3 py-1 bg-black/60 backdrop-blur-md text-white text-xs font-bold rounded-full flex items-center gap-1">
                      {getIcon()} {typeLabel}
                   </span>
                </div>
                <div className="absolute top-3 right-3">
                   <span className="px-2 py-1 bg-amber-500 text-white text-xs font-bold rounded-md flex items-center gap-1 shadow-sm">
                      <FaStar /> {item.rating}
                   </span>
                </div>
                
                {/* Alt Gradient (Yazı okunurluğu için) */}
                <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-black/80 to-transparent" />
                
                {/* Başlık Resmin Üzerinde */}
                <div className="absolute bottom-4 left-4 right-4">
                   <h4 className="text-lg font-bold text-white line-clamp-2 drop-shadow-md">
                      {item.title}
                   </h4>
                </div>
              </div>

              {/* Alt Bilgi Alanı */}
              <div className="p-5 flex-1 flex flex-col justify-between">
                <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-3 mb-4">
                  {item.description || "Bu içerik için açıklama bulunmuyor."}
                </p>
                
                <div className="pt-4 border-t border-gray-100 dark:border-gray-700 w-full text-center">
                   <span className="text-xs font-bold text-sky-600 dark:text-sky-400 uppercase tracking-wider group-hover:underline">
                      Detayları Göster
                   </span>
                </div>
              </div>
            </div>
          </Popover.Button>

          {/* Açılır Panel (MediaCard) */}
          <Transition
            as={Fragment}
            enter="transition ease-out duration-200"
            enterFrom="opacity-0 translate-y-2"
            enterTo="opacity-100 translate-y-0"
            leave="transition ease-in duration-150"
            leaveFrom="opacity-100 translate-y-0"
            leaveTo="opacity-0 translate-y-2"
          >
            <Popover.Panel className="absolute z-30 bottom-full left-0 mb-4 w-full sm:w-80">
              <div className="shadow-2xl rounded-2xl overflow-hidden ring-1 ring-black/5">
                 <MediaCard item={item} refetch={refetch} />
              </div>
            </Popover.Panel>
          </Transition>
        </>
      )}
    </Popover>
  );
}