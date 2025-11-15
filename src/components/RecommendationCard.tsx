// src/components/RecommendationCard.tsx
import { Fragment } from 'react';
import type { MediaItem } from '../types/media';
import { FaStar } from 'react-icons/fa';
// 1. Gerekli Headless UI bileşenlerini import et
import { Popover, Transition } from '@headlessui/react';
// 2. Tam kart tasarımını (MediaCard) import et
import MediaCard from './MediaCard';

interface RecCardProps {
  item: MediaItem | undefined;
  typeLabel: string;
  // 3. refetch fonksiyonunu prop olarak al (MediaCard'a iletmek için)
  refetch: () => void;
}

export default function RecommendationCard({ item, typeLabel, refetch }: RecCardProps) {
  
  // Eğer izlenmeyen öneri kalmadıysa (Bu kısım değişmedi)
  if (!item) {
    return (
      <div className="flex flex-col gap-4 p-4 bg-white dark:bg-gray-800 rounded-2xl shadow-lg h-full">
        <h4 className="font-semibold text-lg text-gray-900 dark:text-white">{typeLabel}</h4>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
          Tebrikler! Bu kategoride izlenmeyen öneri kalmadı.
        </p>
      </div>
    );
  }

  // 4. Öneri varsa, tüm kartı bir Popover ile sarmala
  return (
    <Popover className="relative">
      {({ open }) => (
        <>
          {/* 5. TETİKLEYİCİ: Bu bizim küçük öneri kartımız (tıklanabilir) */}
          <Popover.Button as="div" className="outline-none">
            <div className={`flex flex-col justify-between gap-4 p-4 bg-white dark:bg-gray-800 rounded-2xl shadow-lg h-full cursor-pointer transition ${open ? 'ring-2 ring-sky-500' : 'hover:ring-2 hover:ring-sky-500'}`}>
              <h4 className="font-semibold text-lg text-gray-900 dark:text-white mb-3">{typeLabel} Önerisi</h4>
              <div className="flex gap-3">
                <img 
                  src={item.image || "https://via.placeholder.com/100x150?text=No+Image"} 
                  alt={item.title} 
                  className="w-20 h-28 object-cover rounded-md flex-shrink-0" 
                />
                <div className="flex flex-col min-w-0">
                  <h5 className="font-semibold line-clamp-2 truncate">{item.title}</h5>
                  <div className="flex items-center gap-1 text-sm text-amber-500 mt-1">
                    <FaStar /> {item.rating}
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">
                    {item.description}
                  </p>
                </div>
              </div>
            </div>
          </Popover.Button>

          {/* 6. AÇILIR PANEL: Tıklandığında açılan ve tam MediaCard'ı gösteren bölüm */}
          <Transition
            as={Fragment}
            enter="transition ease-out duration-200"
            enterFrom="opacity-0 translate-y-1"
            enterTo="opacity-100 translate-y-0"
            leave="transition ease-in duration-150"
            leaveFrom="opacity-100 translate-y-0"
            leaveTo="opacity-0 translate-y-1"
          >
            <Popover.Panel className="absolute z-20 bottom-full mb-2 w-72 lg:w-80">
              {/* Panelin içine tam MediaCard'ı yerleştiriyoruz */}
              <MediaCard item={item} refetch={refetch} />
            </Popover.Panel>
          </Transition>
        </>
      )}
    </Popover>
  );
}