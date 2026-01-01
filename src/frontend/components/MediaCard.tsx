// src/components/MediaCard.tsx
import { useState, useEffect } from 'react';
import type { MediaItem } from '../../backend/types/media';
import { FaEye, FaEyeSlash, FaStar, FaTrash, FaPen, FaSpinner, FaCalendarAlt, FaHeart, FaRegHeart, FaTv, FaCheck, FaTimes, FaClock } from 'react-icons/fa';
import { db } from '../../backend/config/firebaseConfig';
import { doc, updateDoc, deleteDoc } from 'firebase/firestore';
import EditModal from './EditModal';
import ImageWithFallback from './ui/ImageWithFallback';
import ConfirmDialog from './ui/ConfirmDialog';
import toast from 'react-hot-toast';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { createActivity, deleteActivitiesForMedia } from '../../backend/services/activityService';

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

      toast.success(t('toast.deleted'));
      refetch();
    } catch (e) {
      console.error("Silme hatası: ", e);
      toast.error(t('toast.deleteError'));
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
            user.photoURL || undefined,
            'media_watched',
            item
          );
        } catch (activityError) {
          console.error('Error creating activity:', activityError);
        }
      }

      toast.success(newValue
        ? (isGame ? t('media.played') : item.type === 'book' ? t('media.read') : t('media.watched'))
        : (isGame ? t('media.notPlayed') : item.type === 'book' ? t('media.notRead') : t('media.notWatched'))
      );
      refetch();
    } catch (e) {
      console.error("Güncelleme hatası: ", e);
      toast.error(t('toast.updateError'));
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
            user.photoURL || undefined,
            newValue ? 'favorite_added' : 'favorite_removed',
            item
          );
        } catch (activityError) {
          console.error('Error creating activity:', activityError);
        }
      }

      toast.success(newValue ? t('toast.favoriteAdded') : t('toast.favoriteRemoved'));
      refetch();
    } catch (e) {
      console.error("Favori güncelleme hatası: ", e);
      toast.error(t('toast.favoriteError'));
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
        className={`group relative rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden bg-white dark:bg-gray-900 shadow-sm transition-all duration-300 ease-in-out flex flex-col h-full ${containerHoverClasses}`}
      >

        <div className="relative w-full bg-gray-50 dark:bg-gray-800">
          <ImageWithFallback
            src={item.image}
            alt={item.title}
            className={`w-full transition-transform duration-500 ${imageHoverClasses} ${isGame
              ? 'h-56 object-cover'
              : 'h-96 object-contain bg-gray-100 dark:bg-gray-800'
              }`}
          />

          <div className="absolute left-3 top-3">
            {/* Diziler için 3 aşamalı durum: İzlendi / Yarıda Kaldı / İzlenmedi */}
            {item.type === 'series' && item.totalSeasons ? (
              <span
                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold shadow-lg backdrop-blur-md border transition-all ${item.watchedSeasons && item.watchedSeasons.length === item.totalSeasons
                  ? "bg-emerald-500 text-white border-emerald-400/50"
                  : item.watchedSeasons && item.watchedSeasons.length > 0
                    ? "bg-amber-500 text-white border-amber-400/50"
                    : "bg-rose-500 text-white border-rose-400/50"
                  }`}
              >
                {item.watchedSeasons && item.watchedSeasons.length === item.totalSeasons ? (
                  <FaCheck className="text-[10px]" />
                ) : item.watchedSeasons && item.watchedSeasons.length > 0 ? (
                  <FaClock className="text-[10px]" />
                ) : (
                  <FaTimes className="text-[10px]" />
                )}
                <span className="hidden md:inline">
                  {item.watchedSeasons && item.watchedSeasons.length === item.totalSeasons
                    ? t('media.watched')
                    : item.watchedSeasons && item.watchedSeasons.length > 0
                      ? t('media.inProgress')
                      : t('media.notWatched')
                  }
                </span>
              </span>
            ) : (
              <span
                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold shadow-lg backdrop-blur-md border transition-all ${localWatched
                  ? "bg-emerald-500 text-white border-emerald-400/50"
                  : "bg-rose-500 text-white border-rose-400/50"
                  }`}
              >
                {localWatched ? <FaCheck className="text-[10px]" /> : <FaTimes className="text-[10px]" />}
                <span className="hidden md:inline">
                  {localWatched
                    ? (isGame ? t('media.played') : item.type === 'book' ? t('media.read') : t('media.watched'))
                    : (isGame ? t('media.notPlayed') : item.type === 'book' ? t('media.notRead') : t('media.notWatched'))
                  }
                </span>
              </span>
            )}
          </div>
          {/* Rating - Her zaman sağ üstte */}
          <div className="absolute right-3 top-3 flex items-center gap-2">
            {/* Sezon Badge - Diziler için */}
            {item.type === 'series' && item.totalSeasons && (
              <span className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium shadow-sm backdrop-blur-md ${item.watchedSeasons && item.watchedSeasons.length === item.totalSeasons
                ? 'bg-emerald-100/90 text-emerald-700 dark:bg-emerald-900/80 dark:text-emerald-200'
                : 'bg-purple-100/90 text-purple-700 dark:bg-purple-900/80 dark:text-purple-200'
                }`}>
                <FaTv size={10} />
                {item.watchedSeasons && item.watchedSeasons.length === item.totalSeasons ? (
                  <><FaCheck size={8} /> {item.totalSeasons}</>
                ) : (
                  `S${item.watchedSeasons?.length || 0}/${item.totalSeasons}`
                )}
              </span>
            )}
            <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium bg-amber-100/90 text-amber-700 dark:bg-amber-900/80 dark:text-amber-200 shadow-sm backdrop-blur-md">
              <FaStar /> {item.rating}
            </span>

            {/* Kalp İkonu - Modal dışındayken sağ üstte */}
            {!isModal && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleFavoriteToggle();
                }}
                disabled={isTogglingFavorite || readOnly}
                className="inline-flex items-center justify-center w-7 h-7 rounded-full shadow-sm backdrop-blur-md transition-all hover:scale-110 disabled:opacity-50"
                style={{
                  backgroundColor: localIsFavorite ? 'rgba(239, 68, 68, 0.9)' : 'rgba(255, 255, 255, 0.9)',
                  color: localIsFavorite ? 'white' : '#ef4444'
                }}
                title={localIsFavorite ? t('actions.removeFavorite') : t('actions.addFavorite')}
              >
                {localIsFavorite ? <FaHeart size={12} /> : <FaRegHeart size={12} />}
              </button>
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
            <p className="text-sm text-gray-500 dark:text-gray-400 italic -mt-1">
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

          {item.createdAt && (
            <div className="flex items-center gap-1.5 text-xs text-gray-400 dark:text-gray-500 mb-1">
              <FaCalendarAlt />
              <span>{t('card.addedOn')}: {formatDate(item.createdAt)}</span>
            </div>
          )}

          <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-3 h-14 mb-1">
            {item.description || t('card.noDescription')}
          </p>

          {/* Only show action buttons if not in read-only mode */}
          {!readOnly && (
            <div className="mt-auto flex items-center justify-between pt-2 gap-2">

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleToggle();
                }}
                disabled={isToggling}
                className="flex-1 md:flex-none inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 dark:border-gray-800 px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-800 transition disabled:opacity-50 h-10"
              >
                {localWatched ? <FaEye /> : <FaEyeSlash />}
                <span className="hidden md:inline">{t('actions.toggleStatus')}</span>
              </button>

              <div className="flex gap-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsEditModalOpen(true);
                  }}
                  title={t('actions.edit')}
                  className="h-10 w-10 inline-flex items-center justify-center rounded-xl border border-gray-200 dark:text-sky-300 dark:border-sky-900/60 hover:bg-sky-50 dark:hover:bg-sky-900/20 transition"
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
                  className="h-10 w-10 inline-flex items-center justify-center rounded-xl border border-gray-200 text-red-300 dark:border-red-900/60 hover:bg-red-50 dark:hover:bg-red-900/20 transition disabled:opacity-50"
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