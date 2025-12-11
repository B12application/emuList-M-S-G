// src/components/RecentMediaCard.tsx
import type { MediaItem } from '../../backend/types/media';
import { FaStar, FaCalendarAlt, FaFilm, FaTv, FaGamepad } from 'react-icons/fa';
import ImageWithFallback from './ui/ImageWithFallback';

interface RecentMediaCardProps {
  item: MediaItem;
  onClick: () => void;
}

export default function RecentMediaCard({ item, onClick }: RecentMediaCardProps) {

  // Tarihi formatla
  const formatDate = (timestamp: any) => {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return new Intl.DateTimeFormat('tr-TR', { day: 'numeric', month: 'short' }).format(date);
  };

  // Türe göre ikon ve renk
  const getTypeIcon = () => {
    switch (item.type) {
      case 'movie': return <FaFilm className="text-sky-500" />;
      case 'series': return <FaTv className="text-emerald-500" />;
      case 'game': return <FaGamepad className="text-amber-500" />;
      default: return <FaFilm className="text-gray-500" />;
    }
  };

  return (
    <div
      onClick={onClick}
      className="group relative flex-shrink-0 w-80 bg-white dark:bg-gray-800/80 backdrop-blur-sm border border-gray-100 dark:border-gray-700 rounded-2xl overflow-hidden cursor-pointer hover:shadow-xl hover:border-sky-200 dark:hover:border-sky-900 transition-all duration-300 transform hover:-translate-y-1"
    >
      <div className="flex h-full">
        {/* Sol: Resim (Genişletildi) */}
        <div className="w-32 h-full relative overflow-hidden">
          <ImageWithFallback
            src={item.image}
            alt={item.title}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/20 to-transparent" />
        </div>

        {/* Sağ: Bilgiler */}
        <div className="flex-1 p-4 flex flex-col justify-between">
          <div>
            {/* Üst Bilgi: Tür ve Puan */}
            <div className="flex justify-between items-start mb-2">
              <div className="p-1.5 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                {getTypeIcon()}
              </div>
              <div className="flex items-center gap-1 text-xs font-bold text-amber-500 bg-amber-50 dark:bg-amber-900/20 px-2 py-1 rounded-md">
                <FaStar /> {item.rating}
              </div>
            </div>

            <h3 className="font-bold text-gray-900 dark:text-white leading-tight line-clamp-2 mb-1">
              {item.title}
            </h3>

            <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2">
              {item.description || "Açıklama girilmemiş."}
            </p>
          </div>

          {/* Alt Bilgi: Tarih */}
          <div className="flex items-center gap-1.5 text-[10px] font-medium text-gray-400 uppercase tracking-wide mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
            <FaCalendarAlt />
            <span>{formatDate(item.createdAt)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}