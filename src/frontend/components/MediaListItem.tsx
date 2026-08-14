// src/components/MediaListItem.tsx
import { useState, useEffect } from 'react';
import type { MediaItem } from '../../backend/types/media';
import {
  FaEye, FaEyeSlash, FaStar, FaTrash, FaPen, FaSpinner,
  FaCalendarAlt, FaHeart, FaRegHeart, FaTv, FaCheck, FaTimes,
  FaFilm, FaClock, FaGamepad, FaBook, FaPlay
} from 'react-icons/fa';
import { db } from '../../backend/config/firebaseConfig';
import { doc, updateDoc, deleteDoc } from 'firebase/firestore';
import EditModal from './EditModal';
import ImageWithFallback from './ui/ImageWithFallback';
import ConfirmDialog from './ui/ConfirmDialog';
import { showMarqueeToast } from './MarqueeToast';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { createActivity, deleteActivitiesForMedia } from '../../backend/services/activityService';
import { getSeriesProgress, toggleEpisodeWatched, updateCurrentProgress } from '../../backend/services/episodeTrackingService';
import AddToListDropdown from './AddToListDropdown';
import { useAppSound } from '../context/SoundContext';
import SeriesProgressModal from './SeriesProgressModal';

interface MediaListItemProps {
  item: MediaItem;
  refetch: () => void;
  onClick: () => void;
  selectionMode?: boolean;
  isSelected?: boolean;
  onToggleSelection?: (id: string) => void;
}

export default function MediaListItem({ 
  item, 
  refetch, 
  onClick, 
  selectionMode = false, 
  isSelected = false, 
  onToggleSelection 
}: MediaListItemProps) {
  const { t, language } = useLanguage();
  const { user } = useAuth();
  const { playPop, playSuccess } = useAppSound();

  const [isDeleting, setIsDeleting] = useState(false);
  const [isToggling, setIsToggling] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
  const [isSeriesProgressModalOpen, setIsSeriesProgressModalOpen] = useState(false);

  const [localWatched, setLocalWatched] = useState(item.watched);
  const [localIsFavorite, setLocalIsFavorite] = useState(item.isFavorite || false);

  useEffect(() => {
    setLocalWatched(item.watched);
    setLocalIsFavorite(item.isFavorite || false);
  }, [item.watched, item.isFavorite]);

  const isGame = item.type === 'game';
  
  const progress = item.type === 'series' ? getSeriesProgress(item) : { percentage: 0, totalWatched: 0, totalEpisodes: 0 };
  const seriesIsCompleted = item.type === 'series' && 
    (item.watched || 
    (item.watchedSeasons && item.totalSeasons && item.watchedSeasons.length === item.totalSeasons) || 
    progress.percentage === 100);
  const seriesHasWatchedEpisodes = item.type === 'series' && 
    item.watchedEpisodes && 
    Object.values(item.watchedEpisodes).some(eps => eps.length > 0);
  const seriesIsInProgress = item.type === 'series' && !seriesIsCompleted && 
    ((item.watchedSeasons && item.watchedSeasons.length > 0) || seriesHasWatchedEpisodes || ('totalWatched' in progress && progress.totalWatched > 0));

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await deleteDoc(doc(db, "mediaItems", item.id));
      if (user) {
        try { await deleteActivitiesForMedia(user.uid, item.id); } catch (e) {}
      }
      showMarqueeToast({ message: `${item.title} ${t('toast.deleted')}`, type: 'deleted', mediaType: item.type as any });
      refetch();
    } catch (e) {
      showMarqueeToast({ message: t('toast.deleteError'), type: 'error' });
      setIsDeleting(false);
    }
  };

  const handleToggleWatch = async (e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (item.type === 'series') {
      setIsSeriesProgressModalOpen(true);
      return;
    }

    const newValue = !localWatched;
    setLocalWatched(newValue);
    setIsToggling(true);
    try {
      await updateDoc(doc(db, "mediaItems", item.id), { watched: newValue });
      if (newValue && user) {
        try { await createActivity(user.uid, user.displayName || 'User', user.photoURL || '', 'media_watched', item); } catch (e) {}
      }
      const statusMessage = newValue 
        ? (isGame ? t('media.played') : item.type === 'book' ? t('media.read') : t('media.watched')) 
        : (isGame ? t('media.notPlayed') : item.type === 'book' ? t('media.notRead') : t('media.notWatched'));
      
      showMarqueeToast({ message: `${item.title} • ${statusMessage}`, type: newValue ? 'watched' : 'not-watched', mediaType: item.type as any });
      if (newValue) playSuccess();
      refetch();
    } catch (e) {
      showMarqueeToast({ message: t('toast.updateError'), type: 'error' });
      setLocalWatched(!newValue);
    } finally {
      setIsToggling(false);
    }
  };

  const handleFavoriteToggle = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const newValue = !localIsFavorite;
    setLocalIsFavorite(newValue);
    try {
      await updateDoc(doc(db, "mediaItems", item.id), { isFavorite: newValue });
      if (user) {
        try { await createActivity(user.uid, user.displayName || 'User', user.photoURL || '', newValue ? 'favorite_added' : 'favorite_removed', item); } catch (e) {}
      }
      showMarqueeToast({ message: newValue ? t('toast.favoriteAdded') : t('toast.favoriteRemoved'), type: 'favorite', mediaType: item.type as any });
      if (newValue) playPop();
      refetch();
    } catch (e) {
      showMarqueeToast({ message: t('toast.favoriteError'), type: 'error' });
      setLocalIsFavorite(!newValue);
    }
  };

  return (
    <>
      <div 
        onClick={() => {
          if (selectionMode && onToggleSelection) {
            onToggleSelection(item.id);
          } else {
            onClick();
          }
        }}
        className={`group relative flex flex-row items-center gap-2.5 sm:gap-4 p-2 sm:p-3.5 bg-white dark:bg-zinc-900 rounded-xl sm:rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 border ${
          isSelected 
            ? 'border-sky-500 ring-1 ring-sky-500 bg-sky-50 dark:bg-sky-900/10' 
            : 'border-stone-200/90 dark:border-zinc-800/90 hover:border-sky-300 dark:hover:border-sky-700'
        } cursor-pointer`}
      >
        {/* Selection Checkbox (Absolute) */}
        {selectionMode && (
          <div className="absolute top-2 left-2 z-20">
            <div className={`w-5 h-5 sm:w-6 sm:h-6 rounded-md sm:rounded-lg flex items-center justify-center transition-all ${
              isSelected
                ? 'bg-sky-500 text-white'
                : 'bg-white/90 dark:bg-zinc-800/90 border-2 border-gray-300 dark:border-zinc-600'
            }`}>
              {isSelected && <FaCheck size={10} />}
            </div>
          </div>
        )}

        {/* Poster Column */}
        <div className="relative w-14 sm:w-20 md:w-24 aspect-[2/3] shrink-0 overflow-hidden rounded-lg sm:rounded-xl bg-slate-100 dark:bg-zinc-800 self-center">
          <ImageWithFallback
            src={item.image}
            alt={item.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
          {/* Top Left Status Badge */}
          <div className="absolute top-1 left-1 z-10">
            {item.type === 'series' && item.totalSeasons ? (
              <span className={`flex items-center justify-center w-5 h-5 sm:w-6 sm:h-6 rounded-full text-[9px] sm:text-[10px] text-white shadow-md backdrop-blur-md border border-white/20 ${
                seriesIsCompleted ? "bg-emerald-500/90" : seriesIsInProgress ? "bg-amber-500/90" : "bg-rose-500/90"
              }`}>
                {seriesIsCompleted ? <FaCheck /> : seriesIsInProgress ? <FaTv /> : <FaTimes />}
              </span>
            ) : (
              <span className={`flex items-center justify-center w-5 h-5 sm:w-6 sm:h-6 rounded-full text-[9px] sm:text-[10px] text-white shadow-md backdrop-blur-md border border-white/20 ${
                localWatched ? "bg-emerald-500/90" : "bg-rose-500/90"
              }`}>
                {localWatched ? <FaCheck /> : <FaTimes />}
              </span>
            )}
          </div>
          {/* Top Right Type Icon */}
          <div className="absolute top-1 right-1 z-10">
            <span className="flex items-center justify-center w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-black/60 text-white/90 shadow-md backdrop-blur-md border border-white/20 text-[8px] sm:text-[10px]">
              {item.type === 'movie' && <FaFilm />}
              {item.type === 'series' && <FaTv />}
              {item.type === 'game' && <FaGamepad />}
              {item.type === 'book' && <FaBook />}
            </span>
          </div>
        </div>

        {/* Content Column */}
        <div className="flex-1 flex flex-col justify-center min-w-0 py-0.5">
          
          {/* Title Row */}
          <div className="flex items-center justify-between gap-1.5 mb-1">
            <h3 className="text-xs sm:text-base font-bold text-stone-900 dark:text-white truncate">
              {item.title}
            </h3>
            {/* Rating Badges */}
            <div className="flex items-center gap-1 shrink-0">
              <span className="inline-flex items-center gap-0.5 rounded-md px-1.5 py-0.5 text-[10px] sm:text-xs font-bold bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400">
                <FaStar size={8} /> {item.rating}
              </span>
              {item.myRating !== undefined && item.myRating > 0 && (
                <span className="hidden sm:inline-flex items-center gap-0.5 rounded-md px-1.5 py-0.5 text-[10px] font-bold bg-rose-50 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400">
                  ⭐ {item.myRating.toFixed(1)}
                </span>
              )}
            </div>
          </div>

          {/* Meta Info + Genres */}
          <div className="flex flex-wrap items-center gap-1.5 text-[10px] sm:text-xs text-stone-500 dark:text-zinc-400 mb-1">
            {item.releaseDate && (
              <span className="flex items-center gap-1">
                <FaCalendarAlt size={9} /> {item.releaseDate.match(/\b(19|20)\d{2}\b/)?.[0] || item.releaseDate}
              </span>
            )}
            {item.releaseDate && item.runtime && <span className="opacity-40">•</span>}
            {item.runtime && (
              <span className="flex items-center gap-1">
                <FaClock size={9} /> {item.runtime}
              </span>
            )}
            {item.genre && (
              <>
                <span className="opacity-40 hidden sm:inline">•</span>
                <div className="hidden sm:flex items-center gap-1">
                  {item.genre.split(', ').slice(0, 2).map((g, idx) => (
                    <span key={idx} className="px-1.5 py-0.2 rounded text-[9px] font-semibold uppercase tracking-wider bg-cyan-50 dark:bg-cyan-900/20 text-cyan-700 dark:text-cyan-400">
                      {g.trim()}
                    </span>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Series Progress Bar (Only for series) */}
          {item.type === 'series' && (item.totalSeasons ?? 0) > 0 && progress.totalWatched > 0 && (
            <div className="w-full max-w-xs mb-1">
              <div className="flex items-center justify-between text-[9px] text-stone-500 dark:text-zinc-400 mb-0.5 font-medium">
                <span>{progress.totalWatched}/{progress.totalEpisodes} Bölüm</span>
                <span className={progress.percentage === 100 ? 'text-emerald-500 font-bold' : 'text-sky-500 font-bold'}>%{progress.percentage}</span>
              </div>
              <div className="w-full bg-stone-100 dark:bg-zinc-800 rounded-full h-1 overflow-hidden">
                <div 
                  className="h-full rounded-full transition-all duration-700"
                  style={{ 
                    width: `${progress.percentage}%`,
                    background: progress.percentage === 100 ? 'linear-gradient(90deg, #10b981, #34d399)' : 'linear-gradient(90deg, #0ea5e9, #38bdf8)' 
                  }}
                />
              </div>
            </div>
          )}

          {/* Description Snippet (Desktop Only) */}
          {item.description && (
            <p className="text-[11px] text-stone-400 dark:text-zinc-500 line-clamp-1 hidden md:block mt-0.5">
              {item.description}
            </p>
          )}
        </div>

        {/* Right Actions Bar */}
        <div className="flex items-center gap-1 sm:gap-1.5 shrink-0 self-center" onClick={(e) => e.stopPropagation()}>
          
          {/* Watch Status Toggle Button */}
          <button
            onClick={handleToggleWatch}
            disabled={isToggling}
            className={`flex items-center gap-1 px-2 sm:px-2.5 py-1.5 rounded-lg sm:rounded-xl text-[10px] sm:text-xs font-bold transition-all disabled:opacity-50 ${
              item.type === 'series' 
                ? seriesIsCompleted
                  ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 border border-emerald-200 dark:border-emerald-800'
                  : seriesIsInProgress
                    ? 'bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-900/40 border border-amber-200 dark:border-amber-800'
                    : 'bg-indigo-50 text-indigo-600 dark:bg-indigo-900/20 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 border border-indigo-200 dark:border-indigo-800'
                : localWatched
                  ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 border border-emerald-200 dark:border-emerald-800'
                  : 'bg-stone-50 text-stone-600 dark:bg-zinc-800 dark:text-zinc-300 hover:bg-stone-100 dark:hover:bg-zinc-700 border border-stone-200 dark:border-zinc-700'
            }`}
            title={
              item.type === 'series' 
                ? (seriesIsCompleted ? t('media.watched') : seriesIsInProgress ? t('media.inProgress') : t('media.notWatched'))
                : localWatched 
                  ? (isGame ? t('media.played') : item.type === 'book' ? t('media.read') : t('media.watched')) 
                  : (isGame ? t('media.notPlayed') : item.type === 'book' ? t('media.notRead') : t('media.notWatched'))
            }
          >
            {isToggling ? (
              <FaSpinner className="animate-spin" size={10} />
            ) : item.type === 'series' ? (
              seriesIsCompleted ? <FaCheck size={10} /> : <FaTv size={10} />
            ) : localWatched ? (
              <FaEye size={10} />
            ) : (
              <FaEyeSlash size={10} />
            )}
            <span className="hidden sm:inline">
              {item.type === 'series' 
                ? (seriesIsCompleted ? t('media.watched') : seriesIsInProgress ? t('media.inProgress') : t('media.notWatched'))
                : localWatched 
                  ? (isGame ? t('media.played') : item.type === 'book' ? t('media.read') : t('media.watched')) 
                  : (isGame ? t('media.notPlayed') : item.type === 'book' ? t('media.notRead') : t('media.notWatched'))
              }
            </span>
            <span className="sm:hidden">
              {item.type === 'series' 
                ? (seriesIsCompleted ? 'İzlendi' : seriesIsInProgress ? 'Devam' : 'Dizi') 
                : localWatched ? 'İzlendi' : 'İzlenmedi'
              }
            </span>
          </button>

          {/* Favorite */}
          <button
            onClick={handleFavoriteToggle}
            className={`flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl transition-all ${
              localIsFavorite 
                ? 'bg-rose-50 dark:bg-rose-900/20 text-rose-500' 
                : 'bg-stone-50 dark:bg-zinc-800 text-stone-400 hover:bg-stone-100 dark:hover:bg-zinc-700 hover:text-rose-400'
            }`}
            title={localIsFavorite ? t('actions.removeFavorite') : t('actions.addFavorite')}
          >
            {localIsFavorite ? <FaHeart size={11} className="animate-pulse" /> : <FaRegHeart size={11} />}
          </button>

          {/* IMDb (Hidden on very small screens) */}
          {item.imdbId && (
            <a
              href={`https://www.imdb.com/title/${item.imdbId}/`}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden md:flex items-center justify-center w-8 h-8 rounded-xl bg-[#f5c518] hover:bg-[#e2b616] text-black transition-transform hover:scale-105"
              title="IMDb"
            >
              <span className="text-[8px] font-black tracking-tighter">IMDb</span>
            </a>
          )}
          
          {/* Add to List Dropdown */}
          <AddToListDropdown itemId={item.id} />
          
          {/* Edit */}
          <button
            onClick={() => setIsEditModalOpen(true)}
            className="flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl bg-stone-50 dark:bg-zinc-800 text-stone-500 dark:text-zinc-400 hover:bg-sky-500 hover:text-white dark:hover:bg-sky-500 transition-colors"
            title={t('actions.edit')}
          >
            <FaPen size={10} />
          </button>
          
          {/* Delete */}
          <button
            onClick={() => setIsConfirmDialogOpen(true)}
            disabled={isDeleting}
            className="flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl bg-stone-50 dark:bg-zinc-800 text-rose-500 hover:bg-rose-500 hover:text-white transition-colors disabled:opacity-50"
            title={t('actions.delete')}
          >
            {isDeleting ? <FaSpinner size={10} className="animate-spin" /> : <FaTrash size={10} />}
          </button>
        </div>
      </div>

      <EditModal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} item={item} refetch={refetch} />
      
      <ConfirmDialog
        isOpen={isConfirmDialogOpen}
        onClose={() => setIsConfirmDialogOpen(false)}
        onConfirm={handleDelete}
        title={t('confirm.deleteTitle')}
        message={t('confirm.deleteMessage').replace('{title}', item.title)}
        confirmText={t('confirm.delete')}
        cancelText={t('confirm.cancel')}
        variant="danger"
      />
      
      <SeriesProgressModal
        isOpen={isSeriesProgressModalOpen}
        onClose={() => setIsSeriesProgressModalOpen(false)}
        item={item}
        refetch={refetch}
      />
    </>
  );
}
