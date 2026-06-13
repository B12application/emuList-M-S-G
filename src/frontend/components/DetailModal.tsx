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

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 py-8 sm:p-6">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300 transform"
              enterFrom="opacity-0 scale-95 translate-y-8"
              enterTo="opacity-100 scale-100 translate-y-0"
              leave="ease-in duration-200 transform"
              leaveFrom="opacity-100 scale-100 translate-y-0"
              leaveTo="opacity-0 scale-95 translate-y-8"
            >
              {/* ⬅️ max-w-2xl ile geniş modal */}
              <Dialog.Panel className="w-full max-w-2xl transform text-left align-middle transition-all relative">

                {/* KAPATMA BUTONU */}
                <button
                  onClick={handleClose}
                  className="absolute -top-3 -right-3 z-[60] flex h-10 w-10 items-center justify-center rounded-full bg-slate-900 text-white shadow-xl border-2 border-white/30 hover:scale-110 hover:bg-slate-800 transition-all cursor-pointer"
                  title={t('common.close') || 'Kapat'}
                >
                  <FaTimes size={16} />
                </button>

                <div className="flex flex-col gap-4">

                  {/* DETAY İÇERİK */}
                  <DetailContent item={item} refetch={refetch} readOnly={readOnly} />

                  {/* BÖLÜM TAKİBİ */}
                  {hasEpisodeData && !readOnly && (
                    <div className="p-4 bg-white/95 dark:bg-zinc-950/95 backdrop-blur-xl rounded-2xl border border-white/20 dark:border-zinc-800 shadow-xl">
                      <EpisodeTracker
                        item={item}
                        onUpdate={() => { setHasChanges(true); refetch(); }}
                      />
                    </div>
                  )}

                  {/* SEZON TAKİBİ */}
                  {hasSeasons && !hasEpisodeData && (
                    <div className="p-4 bg-white/95 dark:bg-zinc-950/95 backdrop-blur-xl rounded-2xl border border-white/20 dark:border-zinc-800 shadow-xl">
                      <SeasonSelector
                        totalSeasons={item.totalSeasons!}
                        watchedSeasons={localWatchedSeasons}
                        onChange={handleSeasonChange}
                        disabled={readOnly || isUpdating}
                      />
                    </div>
                  )}

                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}