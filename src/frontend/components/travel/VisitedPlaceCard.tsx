import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaStar, FaRegStar, FaTrash, FaEdit, FaCamera, FaTimes, FaMapMarkerAlt } from 'react-icons/fa';
import { getAttractionCategory } from '../../services/travelService';
import type { VisitedPlace } from '../../../backend/types/travelPlanner';

interface VisitedPlaceCardProps {
  place: VisitedPlace;
  onDelete?: (id: string) => void;
  onEdit?: (place: VisitedPlace) => void;
  onAddPhoto?: (placeId: string) => void;
}

export default function VisitedPlaceCard({ place, onDelete, onEdit, onAddPhoto }: VisitedPlaceCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const category = getAttractionCategory(place.kinds);

  const visitDate = typeof place.visitedAt === 'string'
    ? new Date(place.visitedAt).toLocaleDateString('tr-TR')
    : place.visitedAt?.toDate?.()?.toLocaleDateString('tr-TR') || '';

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95, x: -20 }}
      className="bg-white dark:bg-zinc-900 rounded-2xl border border-stone-200 dark:border-zinc-800 overflow-hidden shadow-sm hover:shadow-md transition-all group"
    >
      {/* Header */}
      <div
        className="flex items-center gap-3 p-4 cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        {/* Category icon */}
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center text-lg shrink-0"
          style={{ backgroundColor: `${category.color}20` }}
        >
          {category.icon}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-bold text-stone-900 dark:text-white truncate">{place.name}</h4>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-[10px] px-1.5 py-0.5 rounded-full font-medium"
              style={{ backgroundColor: `${category.color}15`, color: category.color }}>
              {category.label}
            </span>
            <span className="text-[10px] text-stone-400 dark:text-zinc-500">{visitDate}</span>
          </div>
        </div>

        {/* Rating */}
        <div className="flex gap-0.5 shrink-0">
          {[1, 2, 3, 4, 5].map(star => (
            <span key={star}>
              {(place.rating || 0) >= star ? (
                <FaStar className="text-amber-400 text-xs" />
              ) : (
                <FaRegStar className="text-stone-300 dark:text-zinc-600 text-xs" />
              )}
            </span>
          ))}
        </div>

        {/* Visited badge */}
        <div className="w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center shrink-0">
          <span className="text-white text-[10px] font-bold">✓</span>
        </div>
      </div>

      {/* Expanded content */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 space-y-3">
              {/* Location */}
              <div className="flex items-center gap-1.5 text-xs text-stone-500 dark:text-zinc-400">
                <FaMapMarkerAlt className="text-red-400" />
                <span>{place.cityName}</span>
                <span className="text-stone-300 dark:text-zinc-600">•</span>
                <span>{place.lat.toFixed(4)}, {place.lon.toFixed(4)}</span>
              </div>

              {/* Notes */}
              {place.notes && (
                <p className="text-xs text-stone-600 dark:text-zinc-300 bg-stone-50 dark:bg-zinc-800/50 rounded-xl p-3 italic">
                  "{place.notes}"
                </p>
              )}

              {/* Photos */}
              {place.photos && place.photos.length > 0 && (
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {place.photos.map((photo, i) => (
                    <img
                      key={i}
                      src={photo}
                      alt={`${place.name} - ${i + 1}`}
                      className="w-20 h-20 rounded-xl object-cover border border-stone-200 dark:border-zinc-700"
                    />
                  ))}
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center gap-2 pt-1">
                <button
                  onClick={() => onAddPhoto?.(place.id)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-stone-600 dark:text-zinc-300 bg-stone-100 dark:bg-zinc-800 rounded-lg hover:bg-stone-200 dark:hover:bg-zinc-700 transition-colors"
                >
                  <FaCamera className="text-violet-500" />
                  Fotoğraf Ekle
                </button>
                <button
                  onClick={() => onEdit?.(place)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-stone-600 dark:text-zinc-300 bg-stone-100 dark:bg-zinc-800 rounded-lg hover:bg-stone-200 dark:hover:bg-zinc-700 transition-colors"
                >
                  <FaEdit className="text-sky-500" />
                  Düzenle
                </button>

                {showConfirmDelete ? (
                  <div className="flex items-center gap-1 ml-auto">
                    <button
                      onClick={() => onDelete?.(place.id)}
                      className="px-2 py-1 text-[10px] font-bold text-white bg-red-500 rounded-lg hover:bg-red-600 transition-colors"
                    >
                      Sil
                    </button>
                    <button
                      onClick={() => setShowConfirmDelete(false)}
                      className="p-1 text-stone-400 hover:text-stone-600 dark:hover:text-zinc-300"
                    >
                      <FaTimes className="text-xs" />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setShowConfirmDelete(true)}
                    className="ml-auto p-1.5 text-stone-400 hover:text-red-500 transition-colors"
                  >
                    <FaTrash className="text-xs" />
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
