// src/components/DetailModal.tsx
import { Fragment, useState, useEffect } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import type { MediaItem } from '../../backend/types/media';
import MediaCard from './MediaCard';
import SeasonSelector from './SeasonSelector';
import { FaTimes } from 'react-icons/fa';
import { useLanguage } from '../context/LanguageContext';
import { db } from '../../backend/config/firebaseConfig';
import { doc, updateDoc } from 'firebase/firestore';
import toast from 'react-hot-toast';

interface DetailModalProps {
  isOpen?: boolean;
  onClose: () => void;
  item: MediaItem | null;
  refetch?: () => void;
  readOnly?: boolean;
}

export default function DetailModal({ isOpen = true, onClose, item, refetch = () => { }, readOnly = false }: DetailModalProps) {
  const { t } = useLanguage();
  const [isUpdating, setIsUpdating] = useState(false);

  // Local state for watched seasons to prevent modal refresh
  const [localWatchedSeasons, setLocalWatchedSeasons] = useState<number[]>([]);
  const [hasChanges, setHasChanges] = useState(false);

  // Sync local state when item changes
  useEffect(() => {
    if (item) {
      setLocalWatchedSeasons(item.watchedSeasons || []);
      setHasChanges(false);
    }
  }, [item?.id, item?.watchedSeasons]);

  if (!item) return null;

  const isSeries = item.type === 'series';
  const hasSeasons = isSeries && item.totalSeasons && item.totalSeasons > 0;

  const handleSeasonChange = async (seasons: number[]) => {
    if (readOnly || !item.id) return;

    // Update local state immediately (no refresh)
    setLocalWatchedSeasons(seasons);
    setHasChanges(true);

    setIsUpdating(true);
    try {
      const itemRef = doc(db, "mediaItems", item.id);
      await updateDoc(itemRef, {
        watchedSeasons: seasons,
        // Eğer tüm sezonlar izlendiyse, watched'ı true yap
        watched: seasons.length === item.totalSeasons
      });
      // Don't call refetch here - will be called on modal close
      // Not showing toast here to avoid duplicate - MediaCard toggle shows it
    } catch (e) {
      console.error("Sezon güncelleme hatası: ", e);
      toast.error(t('toast.updateError'));
      // Revert on error
      setLocalWatchedSeasons(item.watchedSeasons || []);
    } finally {
      setIsUpdating(false);
    }
  };

  // Handle close with refetch if changes were made
  const handleClose = () => {
    if (hasChanges) {
      refetch();
    }
    onClose();
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={handleClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95 translate-y-4"
              enterTo="opacity-100 scale-100 translate-y-0"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100 translate-y-0"
              leaveTo="opacity-0 scale-95 translate-y-4"
            >
              <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-transparent text-left align-middle shadow-xl transition-all relative">
                <button
                  onClick={handleClose}
                  className="absolute top-2 right-2 z-20 p-2 bg-black/50 text-white rounded-full hover:bg-black/80 transition-colors cursor-pointer hover:scale-110 shadow-lg border border-white/20"
                  title={t('common.close') || 'Kapat'}
                >
                  <FaTimes />
                </button>

                {/* MediaCard */}
                <MediaCard item={item} refetch={refetch} isModal={true} readOnly={readOnly} />

                {/* Season Selector - Only for series with seasons */}
                {hasSeasons && (
                  <div className="mt-2 p-4 bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800">
                    <SeasonSelector
                      totalSeasons={item.totalSeasons!}
                      watchedSeasons={localWatchedSeasons}
                      onChange={handleSeasonChange}
                      disabled={readOnly || isUpdating}
                    />
                  </div>
                )}

              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
