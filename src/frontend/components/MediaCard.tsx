// src/components/MediaCard.tsx
import { useState, useEffect } from 'react';
import type { MediaItem } from '../../backend/types/media';
import { FaEye, FaEyeSlash, FaStar, FaTrash, FaPen, FaSpinner, FaCalendarAlt, FaHeart, FaRegHeart, FaTv, FaCheck, FaTimes, FaFilm, FaClock, FaPlay } from 'react-icons/fa';
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
  // 1. YENİ: Bu kartın modal içinde olup olmadığını belirten prop
  isModal?: boolean;
  // Read-only mode for viewing other users' profiles
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

  useEffect(() => {
    setLocalWatched(item.watched);
    setLocalIsFavorite(item.isFavorite || false);
  }, [item.watched, item.isFavorite]);

  const isGame = item.type === 'game';

  // Dizi durum hesaplamaları (watchedSeasons + watchedEpisodes birlikte)
  const progress = item.type === 'series' ? getSeriesProgress(item) : { percentage: 0 };
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
    return new Intl.DateTimeFormat(language === 'en' ? 'en-US' : 'tr-TR', { day: 'numeric', month: 'long', year: 'numeric' }).format(date);
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await deleteDoc(doc(db, "mediaItems", item.id));

      // Delete all related activities
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
      console.error("Silme hatası: ", e);
      showMarqueeToast({ message: t('toast.deleteError'), type: 'error' });
      setIsDeleting(false);
    }
  };

  const handleToggle = async () => {
    const newValue = !localWatched;
    setLocalWatched(newValue);

    setIsToggling(true);
    try {
      // Diziler için: tüm sezonları da güncelle
      const updateData: Record<string, unknown> = { watched: newValue };

      if (item.type === 'series' && item.totalSeasons) {
        if (newValue) {
          // İzlendi olarak işaretlenince tüm sezonları doldur
          updateData.watchedSeasons = Array.from({ length: item.totalSeasons }, (_, i) => i + 1);
        } else {
          // İzlenmedi olarak işaretlenince sezonları temizle
          updateData.watchedSeasons = [];
        }
      }

      await updateDoc(doc(db, "mediaItems", item.id), updateData);

      // Create activity only when marking as watched
      if (newValue && user) {
        try {
          await createActivity(
            user.uid,
            user.displayName || 'User',
            user.photoURL || '',
            'media_watched',
            item
          );
        } catch (activityError) {
          console.error('Error creating activity:', activityError);
        }
      }

      // Show marquee toast notification
      const statusMessage = newValue
        ? (isGame ? t('media.played') : item.type === 'book' ? t('media.read') : t('media.watched'))
        : (isGame ? t('media.notPlayed') : item.type === 'book' ? t('media.notRead') : t('media.notWatched'));

      showMarqueeToast({
        message: `${item.title} • ${statusMessage}`,
        type: newValue ? 'watched' : 'not-watched',
        mediaType: item.type as 'movie' | 'series' | 'book' | 'game'
      });
      if (newValue) playSuccess();
      refetch();
    } catch (e) {
      console.error("Güncelleme hatası: ", e);
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

      // Create activity for favorite changes
      if (user) {
        try {
          await createActivity(
            user.uid,
            user.displayName || 'User',
            user.photoURL || '',
            newValue ? 'favorite_added' : 'favorite_removed',
            item
          );
        } catch (activityError) {
          console.error('Error creating activity:', activityError);
        }
      }

      showMarqueeToast({ message: newValue ? t('toast.favoriteAdded') : t('toast.favoriteRemoved'), type: 'favorite', mediaType: item.type as any });
      if (newValue) playPop();
      refetch();
    } catch (e) {
      console.error("Favori güncelleme hatası: ", e);
      showMarqueeToast({ message: t('toast.favoriteError'), type: 'error' });
      setLocalIsFavorite(!newValue);
    } finally {
      setIsTogglingFavorite(false);
    }
  };

  // 2. YENİ: Modal içindeysek hover efektlerini devre dışı bırak
  const containerHoverClasses = isModal
    ? "" // Modal içindeyse efekt yok
    : "hover:shadow-xl hover:scale-105 hover:z-10"; // Listede ise büyüsün

  const imageHoverClasses = isModal
    ? "" // Modal içindeyse resim büyümesin
    : "group-hover:scale-105"; // Listede ise resim zoom yapsın

  return (
    <>
      <article
        className={`group relative rounded-2xl border border-stone-300 dark:border-zinc-800 overflow-hidden bg-stone-50 dark:bg-zinc-900 shadow-sm transition-all duration-300 ease-in-out flex flex-col h-full ${containerHoverClasses}`}
      >

        <div className="relative w-full bg-stone-100 dark:bg-zinc-800">
          <ImageWithFallback
            src={item.image}
            alt={item.title}
            className={`w-full transition-transform duration-500 ${imageHoverClasses} ${isGame
              ? 'h-56 object-cover'
              : 'h-96 object-contain bg-stone-200 dark:bg-zinc-800'
              }`}
          />

          {/* Sol üst - Durum badge'i */}
          <div className="absolute left-3 top-3 flex flex-col gap-1.5">
            {/* Diziler için durum + sezon bilgisi */}
            {item.type === 'series' && item.totalSeasons ? (
              <>
                <span
                  className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold shadow-lg backdrop-blur-md border transition-all ${seriesIsCompleted
                    ? "bg-emerald-500 text-white border-emerald-400/50"
                    : seriesIsInProgress
                      ? "bg-amber-500 text-white border-amber-400/50"
                      : "bg-rose-500 text-white border-rose-400/50"
                    }`}
                >
                  {seriesIsCompleted ? (
                    <FaCheck size={10} />
                  ) : seriesIsInProgress ? (
                    <FaTv size={10} />
                  ) : (
                    <FaTimes size={10} />
                  )}
                  <span className="hidden md:inline">
                    {seriesIsCompleted
                      ? t('media.watched')
                      : seriesIsInProgress
                        ? t('media.inProgress')
                        : t('media.notWatched')
                    }
                  </span>
                </span>
                {/* Sezon progress badge */}
                <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium bg-white/90 dark:bg-zinc-800/90 text-stone-700 dark:text-zinc-200 shadow-sm backdrop-blur-md">
                  <FaTv size={9} />
                  <span>{item.watchedSeasons?.length || 0}/{item.totalSeasons}</span>
                </span>
              </>
            ) : (
              /* Film/Kitap/Oyun için durum badge'i */
              <span
                className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold shadow-lg backdrop-blur-md border transition-all ${localWatched
                  ? "bg-emerald-500 text-white border-emerald-400/50"
                  : "bg-rose-500 text-white border-rose-400/50"
                  }`}
              >
                {localWatched ? <FaCheck size={10} /> : <FaTimes size={10} />}
                <span className="hidden md:inline">
                  {localWatched
                    ? (isGame ? t('media.played') : item.type === 'book' ? t('media.read') : t('media.watched'))
                    : (isGame ? t('media.notPlayed') : item.type === 'book' ? t('media.notRead') : t('media.notWatched'))
                  }
                </span>
              </span>
            )}
          </div>

          {/* Sağ üst - Rating ve butonlar */}
          <div className="absolute right-3 top-3 flex items-center gap-1.5">
            <span className="inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium bg-amber-100/90 text-amber-700 dark:bg-amber-900/80 dark:text-amber-200 shadow-sm backdrop-blur-md">
              <FaStar size={10} /> {item.rating}
            </span>

            {/* Kişisel puan badge'i */}
            {item.myRating !== undefined && item.myRating > 0 && (
              <span className="inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-bold bg-rose-100/90 text-rose-600 dark:bg-amber-900/70 dark:text-rose-300 shadow-sm backdrop-blur-md" title={item.myNote || ''}>
                ⭐ {item.myRating.toFixed(1)}
              </span>
            )}

            {/* Kısa not ikonu */}
            {item.myNote && (
              <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-white/90 dark:bg-zinc-800/90 text-amber-500 shadow-sm backdrop-blur-md cursor-default" title={item.myNote}>
                📝
              </span>
            )}

            {/* Kalp İkonu - Modal dışındayken */}
            {!isModal && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleFavoriteToggle();
                }}
                disabled={isTogglingFavorite || readOnly}
                className="inline-flex items-center justify-center w-6 h-6 rounded-full shadow-sm backdrop-blur-md transition-all hover:scale-110 disabled:opacity-50"
                style={{
                  backgroundColor: localIsFavorite ? 'rgba(239, 68, 68, 0.9)' : 'rgba(255, 255, 255, 0.9)',
                  color: localIsFavorite ? 'white' : '#ef4444'
                }}
                title={localIsFavorite ? t('actions.removeFavorite') : t('actions.addFavorite')}
              >
                {localIsFavorite ? <FaHeart size={10} /> : <FaRegHeart size={10} />}
              </button>
            )}
            {/* Listeye Ekle butonu */}
            {!isModal && !readOnly && (
              <AddToListDropdown itemId={item.id} />
            )}
          </div>

          {/* Kalp İkonu - Modal içindeyken sol altta (kapatma butonu ile çakışmasın) */}
          {isModal && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleFavoriteToggle();
              }}
              disabled={isTogglingFavorite || readOnly}
              className="absolute left-3 bottom-3 inline-flex items-center justify-center w-9 h-9 rounded-full shadow-lg backdrop-blur-md transition-all hover:scale-110 disabled:opacity-50 z-10"
              style={{
                backgroundColor: localIsFavorite ? 'rgba(239, 68, 68, 0.9)' : 'rgba(255, 255, 255, 0.9)',
                color: localIsFavorite ? 'white' : '#ef4444'
              }}
              title={localIsFavorite ? t('actions.removeFavorite') : t('actions.addFavorite')}
            >
              {localIsFavorite ? <FaHeart size={16} /> : <FaRegHeart size={16} />}
            </button>
          )}
        </div>

        <div className="p-4 flex flex-col gap-2 flex-1">
          <h3 className="text-base font-semibold line-clamp-1 group-hover:text-sky-600 transition-colors">
            {item.title}
          </h3>

          {/* Kitaplar için yazar bilgisi */}
          {item.type === 'book' && item.author && (
            <p className="text-sm text-stone-600 dark:text-zinc-400 italic -mt-1">
              {item.author}
            </p>
          )}

          {/* Tür/Genre bilgisi */}
          {item.genre && (
            <div className="flex flex-wrap gap-1 -mt-0.5">
              {item.genre.split(', ').slice(0, 3).map((g, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300"
                >
                  {g.trim()}
                </span>
              ))}
            </div>
          )}

          {/* Etiketler/Tags */}
          {item.tags && item.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 -mt-0.5">
              {item.tags.slice(0, 3).map((tag, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}

          {/* Tarih bilgileri */}
          <div className="flex flex-col gap-0.5 mb-1">
            {/* Çıkış tarihi */}
            {item.releaseDate && (
              <div className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400">
                <FaFilm size={10} />
                <span>{t('card.releaseDate')}: {item.releaseDate}</span>
              </div>
            )}
            {/* Süre bilgisi */}
            {item.runtime && (
              <div className="flex items-center gap-1.5 text-xs text-purple-600 dark:text-purple-400">
                <FaClock size={10} />
                <span>{t('card.runtime')}: {item.runtime}</span>
              </div>
            )}
            {/* Eklenme tarihi */}
            {item.createdAt && (
              <div className="flex items-center gap-1.5 text-xs text-stone-400 dark:text-zinc-500">
                <FaCalendarAlt size={10} />
                <span>{t('card.addedOn')}: {formatDate(item.createdAt)}</span>
              </div>
            )}
          </div>

          {/* Dizi bölüm ilerleme bilgisi + "Devam Et" butonu - Sadece en az 1 bölüm izlenmişse göster */}
          {item.type === 'series' && item.episodesPerSeason && Object.keys(item.episodesPerSeason).length > 0 && (() => {
            const progress = getSeriesProgress(item);
            if (progress.totalWatched === 0) return null; // Hiç izlenmemişse gösterme
            const totalSeasons = item.totalSeasons || 0;
            const watchedEps = item.watchedEpisodes || {};
            const epsPerSeason = item.episodesPerSeason || {};

            // Sonraki bölümü hesapla
            let nextSeason: number | null = null;
            let nextEpisode: number | null = null;
            for (let s = 1; s <= totalSeasons; s++) {
              const watched = watchedEps[s] || [];
              const total = epsPerSeason[s] || 0;
              if (total === 0) continue;
              for (let e = 1; e <= total; e++) {
                if (!watched.includes(e)) {
                  nextSeason = s;
                  nextEpisode = e;
                  break;
                }
              }
              if (nextSeason) break;
            }

            return (
              <div className="space-y-1.5 mb-1">
                {/* İlerleme barı */}
                <div className="flex items-center justify-between">
                  <span className="text-xs text-stone-500 dark:text-zinc-400 flex items-center gap-1">
                    <FaTv size={9} />
                    {progress.totalWatched}/{progress.totalEpisodes}
                  </span>
                  <span className={`text-xs font-bold ${progress.percentage === 100 ? 'text-emerald-500' : 'text-purple-500'}`}>
                    %{progress.percentage}
                  </span>
                </div>
                <div className="w-full bg-stone-200 dark:bg-zinc-700 rounded-full h-1.5 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${progress.percentage}%`,
                      background: progress.percentage === 100
                        ? 'linear-gradient(90deg, #10b981, #059669)'
                        : 'linear-gradient(90deg, #8b5cf6, #6366f1)',
                    }}
                  />
                </div>
                {/* S3 B4 Devam Et butonu */}
                {nextSeason && nextEpisode ? (
                  <button
                    onClick={async (e) => {
                      e.stopPropagation();
                      try {
                        await toggleEpisodeWatched(item.id, nextSeason!, nextEpisode!, watchedEps);
                        await updateCurrentProgress(item.id, nextSeason!, nextEpisode!);
                        refetch();
                        showMarqueeToast({
                          message: `S${nextSeason} B${nextEpisode} ✓`,
                          type: "watched",
                          mediaType: item.type as any,
                        });
                      } catch (err) {
                        console.error(err);
                      }
                    }}
                    className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-stone-200 dark:bg-zinc-800 hover:bg-teal-50 dark:hover:bg-teal-900/30 border border-stone-300 dark:border-zinc-700 hover:border-teal-400/50 text-stone-600 dark:text-zinc-300 hover:text-teal-600 dark:hover:text-teal-400 text-[11px] font-medium transition-all duration-200 active:scale-[0.98]"
                  >
                    <span className="flex items-center gap-1.5">
                      <FaPlay size={7} />
                      <span className="font-semibold">S{nextSeason} B{nextEpisode}</span>
                    </span>
                    <span className="opacity-70">{t("episodes.continueBtn")}</span>
                  </button>
                ) : (
                  <div className="w-full text-center text-[10px] font-medium py-1.5 rounded-lg bg-stone-200 dark:bg-zinc-800 border border-stone-300 dark:border-zinc-700 text-emerald-600 dark:text-emerald-400">
                    ✓ {t("seasons.completed")}
                  </div>
                )}
              </div>
            );
          })()}

          <p className="text-sm text-stone-600 dark:text-zinc-300 line-clamp-3 h-14 mb-1">
            {item.description || t("card.noDescription")}
          </p>

          {/* Only show action buttons if not in read-only mode */}
          {!readOnly && (
            <div className="mt-auto flex items-center justify-between pt-2 gap-2">

              <div className="flex items-center gap-2 flex-1">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleToggle();
                  }}
                  disabled={isToggling}
                  className={`flex-1 md:flex-none inline-flex items-center justify-center gap-2 rounded-xl border px-3 py-2 text-sm transition disabled:opacity-50 h-10 ${localWatched
                    ? 'border-emerald-300 text-emerald-600 dark:text-emerald-400 dark:border-emerald-800 hover:bg-emerald-50 dark:hover:bg-emerald-900/20'
                    : 'border-stone-300 dark:border-zinc-800 hover:bg-stone-200 dark:hover:bg-zinc-800'
                    }`}
                >
                  {localWatched ? <FaEye /> : <FaEyeSlash />}
                  <span className="hidden md:inline">
                    {localWatched
                      ? (isGame ? t('media.played') : item.type === 'book' ? t('media.read') : t('media.watched'))
                      : (isGame ? t('media.notPlayed') : item.type === 'book' ? t('media.notRead') : t('media.notWatched'))
                    }
                  </span>
                </button>

                {/* IMDb butonu - küçük */}
                {item.imdbId && (
                  <a
                    href={`https://www.imdb.com/title/${item.imdbId}/`}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="h-10 w-10 inline-flex items-center justify-center rounded-xl bg-amber-400 hover:bg-amber-500 text-black text-[10px] font-bold transition"
                    title="IMDb"
                  >
                    IMDb
                  </a>
                )}
              </div>

              <div className="flex gap-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsEditModalOpen(true);
                  }}
                  title={t('actions.edit')}
                  className="h-10 w-10 inline-flex items-center justify-center rounded-xl border border-stone-300 dark:text-sky-300 dark:border-sky-900/60 hover:bg-sky-50 dark:hover:bg-sky-900/20 transition"
                >
                  <FaPen />
                </button>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsConfirmDialogOpen(true);
                  }}
                  disabled={isDeleting}
                  title={t('actions.delete')}
                  className="h-10 w-10 inline-flex items-center justify-center rounded-xl border border-stone-300 text-red-300 dark:border-red-900/60 hover:bg-red-50 dark:hover:bg-red-900/20 transition disabled:opacity-50"
                >
                  {isDeleting ? <FaSpinner className="animate-spin" /> : <FaTrash />}
                </button>
              </div>
            </div>
          )}
        </div>
      </article>

      <EditModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        item={item}
        refetch={refetch}
      />

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