// src/components/DetailModal.tsx
import { Fragment, useState, useEffect } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import type { MediaItem } from '../../backend/types/media';
import DetailContent from './DetailContent';
import SeasonSelector from './SeasonSelector';
import EpisodeTracker from './EpisodeTracker';
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
  const [localWatchedSeasons, setLocalWatchedSeasons] = useState<number[]>([]);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    if (item) {
      setLocalWatchedSeasons(item.watchedSeasons || []);
      setHasChanges(false);
    }
  }, [item?.id, item?.watchedSeasons]);

  if (!item) return null;

  const isSeries = item.type === 'series';
  const hasSeasons = isSeries && item.totalSeasons && item.totalSeasons > 0;
  const hasEpisodeData = isSeries && item.episodesPerSeason && Object.keys(item.episodesPerSeason).length > 0;

  const handleSeasonChange = async (seasons: number[]) => {
    if (readOnly || !item.id) return;
    setLocalWatchedSeasons(seasons);
    setHasChanges(true);
    setIsUpdating(true);
    try {
      const itemRef = doc(db, 'mediaItems', item.id);
      await updateDoc(itemRef, {
        watchedSeasons: seasons,
        watched: seasons.length === item.totalSeasons
      });
    } catch (e) {
      console.error('Sezon güncelleme hatası: ', e);
      toast.error(t('toast.updateError'));
      setLocalWatchedSeasons(item.watchedSeasons || []);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleClose = () => {
    if (hasChanges) refetch();
    onClose();
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-[9999]" onClose={handleClose}>
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

        <div className="fixed inset-0 overflow-y-auto z-[9999]">
          <div className="flex min-h-full items-end justify-center sm:items-center p-0 sm:p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300 transform"
              enterFrom="translate-y-full sm:translate-y-4 sm:opacity-0"
              enterTo="translate-y-0 sm:translate-y-0 sm:opacity-100"
              leave="ease-in duration-200 transform"
              leaveFrom="translate-y-0 sm:translate-y-0 sm:opacity-100"
              leaveTo="translate-y-full sm:translate-y-4 sm:opacity-0"
            >
              <Dialog.Panel className="w-full max-w-2xl transform overflow-hidden bg-stone-50 dark:bg-zinc-950 sm:rounded-3xl rounded-t-3xl text-left align-middle shadow-2xl transition-all flex flex-col max-h-[90vh] sm:max-h-[85vh]">
                
                {/* STICKY HEADER & KAPATMA BUTONU */}
                <div className="sticky top-0 z-20 flex items-center justify-between p-4 bg-white/95 dark:bg-zinc-950/95 backdrop-blur-md border-b border-stone-200 dark:border-zinc-800">
                  <Dialog.Title as="h3" className="text-lg font-black text-stone-900 dark:text-white line-clamp-1 flex-1 pr-4">
                    {item.title}
                  </Dialog.Title>
                  <button
                    onClick={handleClose}
                    className="flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-full bg-stone-100 dark:bg-zinc-900 text-stone-500 hover:bg-stone-200 dark:hover:bg-zinc-800 hover:text-stone-900 dark:hover:text-white transition-colors"
                    title={t('common.close') || 'Kapat'}
                  >
                    <FaTimes size={14} />
                  </button>
                </div>

                {/* SCROLLABLE BODY */}
                <div className="flex-1 overflow-y-auto custom-scrollbar p-0 sm:p-4 bg-stone-100/50 dark:bg-black/20">
                  <div className="flex flex-col gap-4 max-w-full">
                    {/* DETAY İÇERİK */}
                    <DetailContent item={item} refetch={refetch} readOnly={readOnly} />

                    {/* BÖLÜM TAKİBİ */}
                    {hasEpisodeData && !readOnly && (
                      <div className="p-4 bg-white dark:bg-zinc-900/90 rounded-2xl border border-stone-200 dark:border-zinc-800 shadow-sm mx-4 sm:mx-0 mb-4 sm:mb-0">
                        <EpisodeTracker
                          item={item}
                          onUpdate={() => { setHasChanges(true); refetch(); }}
                        />
                      </div>
                    )}

                    {/* SEZON TAKİBİ */}
                    {hasSeasons && !hasEpisodeData && (
                      <div className="p-4 bg-white dark:bg-zinc-900/90 rounded-2xl border border-stone-200 dark:border-zinc-800 shadow-sm mx-4 sm:mx-0 mb-4 sm:mb-0">
                        <SeasonSelector
                          totalSeasons={item.totalSeasons!}
                          watchedSeasons={localWatchedSeasons}
                          onChange={handleSeasonChange}
                          disabled={readOnly || isUpdating}
                        />
                      </div>
                    )}
                  </div>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}