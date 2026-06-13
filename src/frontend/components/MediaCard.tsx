// src/components/MediaCard.tsx
import { useState, useEffect } from 'react';
import type { MediaItem } from '../../backend/types/media';
import {
  FaEye, FaEyeSlash, FaStar, FaTrash, FaPen, FaSpinner,
  FaCalendarAlt, FaHeart, FaRegHeart, FaTv, FaCheck, FaTimes,
  FaFilm, FaClock, FaPlay, FaToggleOn, FaToggleOff, FaLanguage, FaGamepad
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

interface MediaCardProps {
  item: MediaItem;
  refetch: () => void;
  isModal?: boolean;
  readOnly?: boolean;
}

export default function MediaCard({ item, refetch, isModal = false, readOnly = false }: MediaCardProps) {
  const { t, language } = useLanguage();
  const { user } = useAuth();
  const { playPop, playSuccess } = useAppSound();

  const [isDeleting, setIsDeleting] = useState(false);
  const [isToggling, setIsToggling] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);

  const [localWatched, setLocalWatched] = useState(item.watched);
  const [localIsFavorite, setLocalIsFavorite] = useState(item.isFavorite || false);
  const [isTogglingFavorite, setIsTogglingFavorite] = useState(false);
  const [isWatchBtnHovered, setIsWatchBtnHovered] = useState(false);

  // --- Çeviri State'leri ---
  const [translatedDesc, setTranslatedDesc] = useState<string | null>(null);
  const [isTranslating, setIsTranslating] = useState(false);

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

  const formatDate = (timestamp: any) => {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return new Intl.DateTimeFormat(language === 'en' ? 'en-US' : 'tr-TR', { day: 'numeric', month: 'short', year: 'numeric' }).format(date);
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await deleteDoc(doc(db, "mediaItems", item.id));
      if (user) {
        try {
          await deleteActivitiesForMedia(user.uid, item.id);
        } catch (activityError) {
          console.error('Error deleting activities:', activityError);
        }
      }
      showMarqueeToast({ message: `${item.title} ${t('toast.deleted')}`, type: 'deleted', mediaType: item.type as any });
      refetch();
    } catch (e) {
      showMarqueeToast({ message: t('toast.deleteError'), type: 'error' });
      setIsDeleting(false);
    }
  };

  const handleToggle = async () => {
    const newValue = !localWatched;
    setLocalWatched(newValue);
    setIsToggling(true);
    try {
      const updateData: Record<string, unknown> = { watched: newValue };
      if (item.type === 'series' && item.totalSeasons) {
        updateData.watchedSeasons = newValue ? Array.from({ length: item.totalSeasons }, (_, i) => i + 1) : [];
      }
      await updateDoc(doc(db, "mediaItems", item.id), updateData);
      if (newValue && user) {
        try {
          await createActivity(user.uid, user.displayName || 'User', user.photoURL || '', 'media_watched', item);
        } catch (activityError) { }
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

  const handleFavoriteToggle = async () => {
    const newValue = !localIsFavorite;
    setLocalIsFavorite(newValue);
    setIsTogglingFavorite(true);
    try {
      await updateDoc(doc(db, "mediaItems", item.id), { isFavorite: newValue });
      if (user) {
        try {
          await createActivity(user.uid, user.displayName || 'User', user.photoURL || '', newValue ? 'favorite_added' : 'favorite_removed', item);
        } catch (activityError) { }
      }
      showMarqueeToast({ message: newValue ? t('toast.favoriteAdded') : t('toast.favoriteRemoved'), type: 'favorite', mediaType: item.type as any });
      if (newValue) playPop();
      refetch();
    } catch (e) {
      showMarqueeToast({ message: t('toast.favoriteError'), type: 'error' });
      setLocalIsFavorite(!newValue);
    } finally {
      setIsTogglingFavorite(false);
    }
  };

  // --- Çeviri Fonksiyonu ---
  const handleTranslate = async () => {
    if (!item.description) return;
    if (translatedDesc) {
      setTranslatedDesc(null);
      return;
    }
    setIsTranslating(true);
    try {
      const res = await fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(item.description)}&langpair=en|tr`);
      const data = await res.json();
      if (data?.responseData?.translatedText) {
        setTranslatedDesc(data.responseData.translatedText);
      }
    } catch (error) {
      console.error("Çeviri başarısız oldu:", error);
    } finally {
      setIsTranslating(false);
    }
  };

  const containerHoverClasses = isModal
    ? ""
    : "hover:-translate-y-1.5 hover:shadow-2xl hover:shadow-cyan-500/10 cursor-pointer";

  // ═══════════════════════════════════════════
  // OYUNLAR İÇİN FARKLI GÖRSEL KONTEYNER
  // ═══════════════════════════════════════════
  const renderImageContainer = () => {
    if (isGame) {
      // Oyunlar için: karemsi/yatay görsel, altta bilgi katmanı
      return (
        <div className="relative w-full aspect-[16/10] shrink-0 overflow-hidden bg-slate-100 dark:bg-zinc-900">
          <ImageWithFallback
            src={item.image}
            alt={item.title}
            className="w-full h-full object-cover transition-all duration-700 ease-out group-hover:scale-105"
          />

          {/* Gradient overlay - oyunlar için daha ince, üstten ve alttan */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-black/20 opacity-90 group-hover:opacity-100 transition-opacity duration-300" />

          {/* Sol üst: Durum badge */}
          <div className="absolute top-3 left-3 z-10">
            <span className={`inline-flex items-center gap-1.5 rounded-xl px-2.5 py-1 text-[11px] font-bold tracking-wide text-white shadow-lg backdrop-blur-md border border-white/20 ${localWatched ? "bg-emerald-500/80" : "bg-rose-500/80"
              }`}>
              {localWatched ? <FaCheck size={10} /> : <FaTimes size={10} />}
              <span>{localWatched ? t('media.played') : t('media.notPlayed')}</span>
            </span>
          </div>

          {/* Sağ üst: Favori + Rating + Platform */}
          <div className="absolute top-3 right-3 flex flex-col items-end gap-2 z-10">
            {!isModal && (
              <button
                onClick={(e) => { e.stopPropagation(); handleFavoriteToggle(); }}
                disabled={isTogglingFavorite || readOnly}
                className={`flex items-center justify-center w-8 h-8 rounded-full shadow-lg backdrop-blur-md border border-white/20 transition-all hover:scale-110 active:scale-95 disabled:opacity-50 ${localIsFavorite ? 'bg-rose-500/90 text-white' : 'bg-black/40 text-white/70 hover:bg-black/60 hover:text-white'
                  }`}
                title={localIsFavorite ? t('actions.removeFavorite') : t('actions.addFavorite')}
              >
                {localIsFavorite ? <FaHeart size={14} className="animate-pulse" /> : <FaRegHeart size={14} />}
              </button>
            )}
            <span className="inline-flex items-center gap-1 rounded-xl px-2.5 py-1 text-xs font-bold bg-black/60 text-amber-400 backdrop-blur-md border border-white/10 shadow-lg">
              <FaStar size={10} /> {item.rating}
            </span>
            {item.myRating !== undefined && item.myRating > 0 && (
              <span className="inline-flex items-center gap-1 rounded-xl px-2 py-1 text-[10px] font-bold bg-rose-500/20 text-rose-300 backdrop-blur-md border border-rose-500/30" title={item.myNote || ''}>
                ⭐ {item.myRating.toFixed(1)}
              </span>
            )}
            {/* Oyun platformu varsa */}
            {item.platform && (
              <span className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[10px] font-bold bg-violet-500/30 text-violet-200 backdrop-blur-md border border-violet-500/30">
                <FaGamepad size={9} /> {item.platform}
              </span>
            )}
          </div>

          {/* Alt bilgi katmanı */}
          <div className="absolute bottom-0 left-0 right-0 p-4 flex flex-col justify-end z-10">
            <h3 className="text-xl font-black text-white leading-tight line-clamp-2 mb-1 drop-shadow-md">
              {item.title}
            </h3>
            <div className="flex flex-wrap items-center gap-2 text-[11px] font-medium text-white/60 mt-1">
              {item.releaseDate && (
                <span className="flex items-center gap-1"><FaCalendarAlt size={9} /> {item.releaseDate}</span>
              )}
              {item.releaseDate && item.runtime && <span>•</span>}
              {item.runtime && (
                <span className="flex items-center gap-1"><FaClock size={9} /> {item.runtime}</span>
              )}
            </div>
          </div>
        </div>
      );
    }

    // Film, dizi, kitap için: mevcut dikey poster yapısı (orijinal)
    const imageHoverClasses = isModal
      ? ""
      : "group-hover:scale-110 group-hover:rotate-1";

    return (
      <div className="relative w-full aspect-[3/4] shrink-0 overflow-hidden bg-slate-100 dark:bg-zinc-900">
        <ImageWithFallback
          src={item.image}
          alt={item.title}
          className={`w-full h-full object-cover transition-all duration-700 ease-out ${imageHoverClasses}`}
        />

        <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/40 to-black/30 opacity-90 group-hover:opacity-100 transition-opacity duration-300" />

        <div className="absolute top-3 left-3 z-10">
          {item.type === 'series' && item.totalSeasons ? (
            <div className="flex flex-col gap-1.5">
              <span className={`inline-flex items-center gap-1.5 rounded-xl px-2.5 py-1 text-[11px] font-bold tracking-wide text-white shadow-lg backdrop-blur-md border border-white/20 ${seriesIsCompleted ? "bg-emerald-500/80" : seriesIsInProgress ? "bg-amber-500/80" : "bg-rose-500/80"
                }`}>
                {seriesIsCompleted ? <FaCheck size={10} /> : seriesIsInProgress ? <FaTv size={10} /> : <FaTimes size={10} />}
                <span>{seriesIsCompleted ? t('media.watched') : seriesIsInProgress ? t('media.inProgress') : t('media.notWatched')}</span>
              </span>
              <span className="inline-flex items-center gap-1 rounded-lg px-2 py-0.5 text-[10px] font-bold bg-black/50 text-white/90 backdrop-blur-md border border-white/10 w-fit">
                <FaTv size={8} /> {item.watchedSeasons?.length || 0}/{item.totalSeasons} S
              </span>
            </div>
          ) : (
            <span className={`inline-flex items-center gap-1.5 rounded-xl px-2.5 py-1 text-[11px] font-bold tracking-wide text-white shadow-lg backdrop-blur-md border border-white/20 ${localWatched ? "bg-emerald-500/80" : "bg-rose-500/80"
              }`}>
              {localWatched ? <FaCheck size={10} /> : <FaTimes size={10} />}
              <span>{localWatched ? (item.type === 'book' ? t('media.read') : t('media.watched')) : (item.type === 'book' ? t('media.notRead') : t('media.notWatched'))}</span>
            </span>
          )}
        </div>

        <div className="absolute top-3 right-3 flex flex-col items-end gap-2 z-10">
          {!isModal && (
            <button
              onClick={(e) => { e.stopPropagation(); handleFavoriteToggle(); }}
              disabled={isTogglingFavorite || readOnly}
              className={`flex items-center justify-center w-8 h-8 rounded-full shadow-lg backdrop-blur-md border border-white/20 transition-all hover:scale-110 active:scale-95 disabled:opacity-50 ${localIsFavorite ? 'bg-rose-500/90 text-white' : 'bg-black/40 text-white/70 hover:bg-black/60 hover:text-white'
                }`}
              title={localIsFavorite ? t('actions.removeFavorite') : t('actions.addFavorite')}
            >
              {localIsFavorite ? <FaHeart size={14} className="animate-pulse" /> : <FaRegHeart size={14} />}
            </button>
          )}
          <span className="inline-flex items-center gap-1 rounded-xl px-2.5 py-1 text-xs font-bold bg-black/60 text-amber-400 backdrop-blur-md border border-white/10 shadow-lg">
            <FaStar size={10} /> {item.rating}
          </span>
          {item.myRating !== undefined && item.myRating > 0 && (
            <span className="inline-flex items-center gap-1 rounded-xl px-2 py-1 text-[10px] font-bold bg-rose-500/20 text-rose-300 backdrop-blur-md border border-rose-500/30" title={item.myNote || ''}>
              ⭐ {item.myRating.toFixed(1)}
            </span>
          )}
        </div>

        <div className="absolute bottom-0 left-0 right-0 p-4 flex flex-col justify-end z-10">
          <h3 className="text-xl font-black text-white leading-tight line-clamp-2 mb-1 drop-shadow-md">
            {item.title}
          </h3>
          {item.type === 'book' && item.author && (
            <p className="text-sm font-medium text-white/70 italic line-clamp-1">{item.author}</p>
          )}
          <div className="flex flex-wrap items-center gap-2 text-[11px] font-medium text-white/60 mt-1">
            {item.releaseDate && (
              <span className="flex items-center gap-1"><FaFilm size={9} /> {item.releaseDate}</span>
            )}
            {item.releaseDate && item.runtime && <span>•</span>}
            {item.runtime && (
              <span className="flex items-center gap-1"><FaClock size={9} /> {item.runtime}</span>
            )}
          </div>
        </div>
      </div>
    );
  };

  // ═══════════════════════════════════════════
  // ANA RENDER
  // ═══════════════════════════════════════════
  return (
    <>
      <article className={`group relative flex flex-col h-full w-full rounded-2xl border border-slate-200/60 dark:border-zinc-800 bg-white dark:bg-zinc-950/80 overflow-hidden shadow-lg backdrop-blur-xl transition-all duration-500 ${containerHoverClasses}`}>

        {/* ═══ GÖRSEL ALANI - Tip bazlı render ═══ */}
        {renderImageContainer()}

        <div className="flex flex-col flex-1 p-4">

          {/* Genre & Tags */}
          <div className="flex flex-wrap gap-1.5 mb-3">
            {item.genre && item.genre.split(', ').slice(0, 2).map((g, idx) => (
              <span key={`g-${idx}`} className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400">
                {g.trim()}
              </span>
            ))}
            {item.tags && item.tags.slice(0, 1).map((tag, idx) => (
              <span key={`t-${idx}`} className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400">
                #{tag}
              </span>
            ))}
            {/* Oyun türü için ekstra badge */}
            {isGame && (
              <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400 flex items-center gap-1">
                <FaGamepad size={9} /> {t('media.game') || 'Oyun'}
              </span>
            )}
          </div>

          {/* ═══ ÇEVİRİ VE AÇIKLAMA ALANI ═══ */}
          <div className="flex flex-col mb-3 flex-1">
            {isModal && item.description && (
              <div className="flex justify-end mb-2">
                <button
                  onClick={(e) => { e.stopPropagation(); handleTranslate(); }}
                  disabled={isTranslating}
                  className="flex items-center gap-1.5 px-2.5 py-1 bg-sky-50 dark:bg-sky-900/20 text-sky-600 dark:text-sky-400 text-[10px] font-bold rounded-lg hover:bg-sky-100 dark:hover:bg-sky-900/40 transition-colors disabled:opacity-50"
                >
                  {isTranslating ? <FaSpinner className="animate-spin" /> : <FaLanguage size={14} />}
                  {isTranslating ? 'Çevriliyor...' : translatedDesc ? 'Orijinali Göster' : 'Türkçeye Çevir'}
                </button>
              </div>
            )}
            <p className={`text-xs text-slate-500 dark:text-zinc-400 leading-relaxed ${isModal ? 'overflow-y-auto max-h-32 custom-scrollbar pr-1' : 'line-clamp-3'}`}>
              {translatedDesc || item.description || t("card.noDescription")}
            </p>
          </div>

          {/* Dizi Progress - sadece diziler için */}
          {item.type === 'series' && item.episodesPerSeason && Object.keys(item.episodesPerSeason).length > 0 && (() => {
            const progress = getSeriesProgress(item);
            if (progress.totalWatched === 0) return null;

            let nextSeason: number | null = null;
            let nextEpisode: number | null = null;
            const watchedEps = item.watchedEpisodes || {};
            const epsPerSeason = item.episodesPerSeason || {};

            for (let s = 1; s <= (item.totalSeasons || 0); s++) {
              const watched = watchedEps[s] || [];
              const total = epsPerSeason[s] || 0;
              if (total === 0) continue;
              for (let e = 1; e <= total; e++) {
                if (!watched.includes(e)) { nextSeason = s; nextEpisode = e; break; }
              }
              if (nextSeason) break;
            }

            return (
              <div className="w-full bg-slate-50 dark:bg-zinc-900/50 rounded-xl p-2.5 mb-3 border border-slate-100 dark:border-zinc-800/50">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[10px] font-bold text-slate-500 dark:text-zinc-400 flex items-center gap-1">
                    <FaTv size={8} /> {progress.totalWatched}/{progress.totalEpisodes} Bölüm
                  </span>
                  <span className={`text-[10px] font-black ${progress.percentage === 100 ? 'text-emerald-500' : 'text-cyan-500'}`}>
                    %{progress.percentage}
                  </span>
                </div>
                <div className="w-full bg-slate-200 dark:bg-zinc-800 rounded-full h-1 overflow-hidden mb-2">
                  <div className="h-full rounded-full transition-all duration-700 ease-out"
                    style={{
                      width: `${progress.percentage}%`,
                      background: progress.percentage === 100 ? 'linear-gradient(90deg, #10b981, #34d399)' : 'linear-gradient(90deg, #06b6d4, #3b82f6)'
                    }}
                  />
                </div>
                {nextSeason && nextEpisode ? (
                  <button
                    onClick={async (e) => {
                      e.stopPropagation();
                      try {
                        await toggleEpisodeWatched(item.id, nextSeason!, nextEpisode!, watchedEps);
                        await updateCurrentProgress(item.id, nextSeason!, nextEpisode!);
                        refetch();
                        showMarqueeToast({ message: `S${nextSeason} B${nextEpisode} ✓`, type: "watched", mediaType: item.type as any });
                      } catch (err) { }
                    }}
                    className="w-full flex items-center justify-center gap-1.5 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-600 text-white text-[10px] font-bold transition-colors active:scale-[0.98]"
                  >
                    <FaPlay size={7} /> İzle: S{nextSeason} B{nextEpisode}
                  </button>
                ) : (
                  <div className="w-full text-center text-[10px] font-bold py-1.5 text-emerald-500 bg-emerald-500/10 rounded-lg">
                    ✓ {t("seasons.completed")}
                  </div>
                )}
              </div>
            );
          })()}

          <div className="w-full h-px bg-slate-200/60 dark:bg-zinc-800 mb-3 mt-auto" />

          {/* Aksiyon butonları */}
          {!readOnly && (
            <div className="flex items-center justify-between gap-2">
              <button
                onClick={(e) => { e.stopPropagation(); handleToggle(); }}
                onMouseEnter={() => setIsWatchBtnHovered(true)}
                onMouseLeave={() => setIsWatchBtnHovered(false)}
                disabled={isToggling}
                className={`flex-1 flex items-center justify-center gap-2 h-9 rounded-xl text-xs font-bold transition-all duration-300 disabled:opacity-50 ${isWatchBtnHovered
                  ? localWatched
                    ? 'bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-500/30'
                    : 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30'
                  : localWatched
                    ? 'bg-slate-100 dark:bg-zinc-800 text-emerald-600 dark:text-emerald-400 border border-transparent'
                    : 'bg-slate-100 dark:bg-zinc-800 text-slate-500 dark:text-zinc-400 border border-transparent'
                  }`}
              >
                {isWatchBtnHovered
                  ? localWatched ? <FaToggleOn size={14} className="text-rose-500" /> : <FaToggleOff size={14} className="text-emerald-500" />
                  : localWatched ? <FaEye size={14} /> : <FaEyeSlash size={14} />
                }
                <span>
                  {localWatched
                    ? (isGame ? t('media.played') : item.type === 'book' ? t('media.read') : t('media.watched'))
                    : (isGame ? t('media.notPlayed') : item.type === 'book' ? t('media.notRead') : t('media.notWatched'))
                  }
                </span>
              </button>

              <div className="flex items-center gap-1.5 shrink-0">
                {item.imdbId && (
                  <a
                    href={`https://www.imdb.com/title/${item.imdbId}/`}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="flex items-center justify-center w-9 h-9 rounded-xl bg-[#f5c518] hover:bg-[#e2b616] text-black transition-transform hover:scale-105 active:scale-95"
                    title="IMDb"
                  >
                    <span className="text-[9px] font-black tracking-tighter">IMDb</span>
                  </a>
                )}
                {!isModal && <AddToListDropdown itemId={item.id} />}
                <button
                  onClick={(e) => { e.stopPropagation(); setIsEditModalOpen(true); }}
                  className="flex items-center justify-center w-9 h-9 rounded-xl bg-slate-100 dark:bg-zinc-800 text-slate-500 dark:text-zinc-400 hover:bg-sky-500 hover:text-white dark:hover:bg-sky-500 transition-colors"
                >
                  <FaPen size={12} />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); setIsConfirmDialogOpen(true); }}
                  disabled={isDeleting}
                  className="flex items-center justify-center w-9 h-9 rounded-xl bg-slate-100 dark:bg-zinc-800 text-rose-500 hover:bg-rose-500 hover:text-white transition-colors disabled:opacity-50"
                >
                  {isDeleting ? <FaSpinner size={12} className="animate-spin" /> : <FaTrash size={12} />}
                </button>
              </div>
            </div>
          )}
        </div>
      </article>

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
    </>
  );
}