// src/components/RecommendationCard.tsx
import type{ MediaItem } from '../types/media';
import { FaStar } from 'react-icons/fa';

interface RecCardProps {
  item: MediaItem | undefined; // Öğe bulunamazsa 'undefined' olabilir
  typeLabel: string;
}

export default function RecommendationCard({ item, typeLabel }: RecCardProps) {
  
  // Eğer o kategoride (örn: film) izlenmeyen öğe kalmadıysa
  if (!item) {
    return (
      <div className="flex flex-col justify-between gap-4 p-4 bg-white dark:bg-gray-800 rounded-2xl shadow-lg h-full">
        <div>
          <h4 className="font-semibold text-lg text-gray-900 dark:text-white">{typeLabel}</h4>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
            Tebrikler! Bu kategoride izlenmeyen öneri kalmadı.
          </p>
        </div>
      </div>
    );
  }

  // Eğer öneri varsa
  return (
    <div className="flex flex-col justify-between gap-4 p-4 bg-white dark:bg-gray-800 rounded-2xl shadow-lg h-full">
      <div>
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
    </div>
  );
}