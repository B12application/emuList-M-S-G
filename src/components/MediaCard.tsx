// src/components/MediaCard.tsx
import { useState, useEffect } from 'react';
import type { MediaItem } from '../types/media';
import { FaEye, FaEyeSlash, FaStar, FaTrash, FaPen, FaSpinner, FaCalendarAlt, FaHeart, FaRegHeart } from 'react-icons/fa';
import { db } from '../firebaseConfig';
import { doc, updateDoc, deleteDoc } from 'firebase/firestore';
import EditModal from './EditModal';
import ImageWithFallback from './ui/ImageWithFallback';
import ConfirmDialog from './ui/ConfirmDialog';
import toast from 'react-hot-toast';
import { useLanguage } from '../context/LanguageContext';

interface MediaCardProps {
  item: MediaItem;
  refetch: () => void;
  // 1. YENİ: Bu kartın modal içinde olup olmadığını belirten prop
  isModal?: boolean;
}

export default function MediaCard({ item, refetch, isModal = false }: MediaCardProps) {
  const { t, language } = useLanguage();
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
      await updateDoc(doc(db, "mediaItems", item.id), { watched: newValue });
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
            <span
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium shadow-sm backdrop-blur-md ${localWatched
                ? "bg-emerald-100/90 text-emerald-700 dark:bg-emerald-900/80 dark:text-emerald-200"
                : "bg-rose-100/90 text-rose-700 dark:bg-rose-900/80 dark:text-rose-200"
                }`}
            >
              {localWatched ? <FaEye /> : <FaEyeSlash />}
              <span className="hidden md:inline">
                {localWatched
                  ? (isGame ? t('media.played') : item.type === 'book' ? t('media.read') : t('media.watched'))
                  : (isGame ? t('media.notPlayed') : item.type === 'book' ? t('media.notRead') : t('media.notWatched'))
                }
              </span>
            </span>
          </div>
          <div className="absolute right-3 top-3 flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium bg-amber-100/90 text-amber-700 dark:bg-amber-900/80 dark:text-amber-200 shadow-sm backdrop-blur-md">
              <FaStar /> {item.rating}
            </span>

            {/* Kalp İkonu (Favori Toggle) */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleFavoriteToggle();
              }}
              disabled={isTogglingFavorite}
              className="inline-flex items-center justify-center w-7 h-7 rounded-full shadow-sm backdrop-blur-md transition-all hover:scale-110 disabled:opacity-50"
              style={{
                backgroundColor: localIsFavorite ? 'rgba(239, 68, 68, 0.9)' : 'rgba(255, 255, 255, 0.9)',
                color: localIsFavorite ? 'white' : '#ef4444'
              }}
              title={localIsFavorite ? t('actions.removeFavorite') : t('actions.addFavorite')}
            >
              {localIsFavorite ? <FaHeart size={12} /> : <FaRegHeart size={12} />}
            </button>
          </div>
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

          {item.createdAt && (
            <div className="flex items-center gap-1.5 text-xs text-gray-400 dark:text-gray-500 mb-1">
              <FaCalendarAlt />
              <span>{t('card.addedOn')}: {formatDate(item.createdAt)}</span>
            </div>
          )}

          <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-3 h-14 mb-1">
            {item.description || t('card.noDescription')}
          </p>

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