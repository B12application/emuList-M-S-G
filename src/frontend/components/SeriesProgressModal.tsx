// src/components/SeriesProgressModal.tsx
import { Fragment, useState, useEffect } from 'react';
import { Dialog, Transition, Tab } from '@headlessui/react';
import { FaTimes, FaCheck, FaUndo, FaSave, FaTv, FaSpinner } from 'react-icons/fa';
import type { MediaItem } from '../../backend/types/media';
import { 
  markSeriesFullyWatched, 
  markSeriesUnwatched, 
  markSeriesUpToEpisode,
  getSeriesProgress
} from '../../backend/services/episodeTrackingService';
import EpisodeTracker from './EpisodeTracker';
import { useLanguage } from '../context/LanguageContext';
import { useAppSound } from '../context/SoundContext';
import toast from 'react-hot-toast';
import { showMarqueeToast } from './MarqueeToast';
import { useAuth } from '../context/AuthContext';
import { createActivity } from '../../backend/services/activityService';

interface SeriesProgressModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: MediaItem;
  refetch: () => void;
}

export default function SeriesProgressModal({ isOpen, onClose, item, refetch }: SeriesProgressModalProps) {
  const { t } = useLanguage();
  const { playSuccess, playClick } = useAppSound();
  const { user } = useAuth();
  
  const [isLoading, setIsLoading] = useState(false);
  const [targetSeason, setTargetSeason] = useState(item.currentSeason || 1);
  const [targetEpisode, setTargetEpisode] = useState(item.currentEpisode || 1);
  
  // Update state when modal opens
  useEffect(() => {
    if (isOpen) {
      setTargetSeason(item.currentSeason || 1);
      setTargetEpisode(item.currentEpisode || 1);
    }
  }, [isOpen, item.currentSeason, item.currentEpisode]);

  if (item.type !== 'series') return null;

  const totalSeasons = item.totalSeasons || 0;
  const episodesPerSeason = item.episodesPerSeason || {};
  const maxEpisodesForTarget = episodesPerSeason[targetSeason] || 0;
  
  const progress = getSeriesProgress(item);

  const handleAction = async (action: () => Promise<void>, successMessage: string) => {
    setIsLoading(true);
    try {
      await action();
      refetch();
      showMarqueeToast({ message: successMessage, type: 'watched', mediaType: 'series' });
      
      // Activity stream integration
      if (user) {
         try {
           await createActivity(user.uid, user.displayName || 'User', user.photoURL || '', 'media_watched', item);
         } catch (e) {}
      }
      
      setTimeout(() => {
        onClose();
      }, 300);
    } catch (e) {
      console.error(e);
      toast.error('İşlem başarısız oldu');
    } finally {
      setIsLoading(false);
    }
  };

  const handleMarkFullyWatched = () => {
    playSuccess();
    handleAction(
      () => markSeriesFullyWatched(item), 
      `${item.title} • Tüm bölümler izlendi`
    );
  };

  const handleMarkUnwatched = () => {
    playClick();
    handleAction(
      () => markSeriesUnwatched(item), 
      `${item.title} • İzleme durumu sıfırlandı`
    );
  };

  const handleMarkUpToEpisode = () => {
    if (targetSeason === 0 || targetEpisode === 0) return;
    playSuccess();
    handleAction(
      () => markSeriesUpToEpisode(item, targetSeason, targetEpisode), 
      `${item.title} • S${targetSeason} B${targetEpisode}'ye kadar izlendi`
    );
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-[250]" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto z-[250]">
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
              <Dialog.Panel className="w-full max-w-lg transform overflow-hidden sm:rounded-3xl rounded-t-3xl bg-white dark:bg-zinc-950 p-0 text-left align-middle shadow-2xl transition-all flex flex-col max-h-[90vh]">
                
                {/* Header */}
                <div className="sticky top-0 z-10 flex items-center justify-between p-4 sm:p-5 border-b border-stone-200 dark:border-zinc-800 bg-white/95 dark:bg-zinc-950/95 backdrop-blur-xl">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                      <FaTv size={18} />
                    </div>
                    <div>
                      <Dialog.Title as="h3" className="text-base font-bold text-stone-900 dark:text-white line-clamp-1">
                        {item.title}
                      </Dialog.Title>
                      <p className="text-xs text-stone-500 dark:text-zinc-400">İlerleme: {progress.percentage}%</p>
                    </div>
                  </div>
                  <button
                    onClick={onClose}
                    className="flex items-center justify-center w-8 h-8 rounded-full bg-stone-100 dark:bg-zinc-900 text-stone-500 hover:bg-stone-200 dark:hover:bg-zinc-800 transition-colors"
                  >
                    <FaTimes size={14} />
                  </button>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto custom-scrollbar p-4 sm:p-5 space-y-6">
                  
                  {/* Quick Actions */}
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={handleMarkFullyWatched}
                      disabled={isLoading || totalSeasons === 0}
                      className="flex flex-col items-center justify-center gap-2 p-4 rounded-2xl bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-900/20 dark:hover:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <FaCheck size={20} />
                      <span className="text-xs font-bold text-center">Hepsini İzledim</span>
                    </button>
                    
                    <button
                      onClick={handleMarkUnwatched}
                      disabled={isLoading || progress.totalWatched === 0}
                      className="flex flex-col items-center justify-center gap-2 p-4 rounded-2xl bg-rose-50 hover:bg-rose-100 dark:bg-rose-900/20 dark:hover:bg-rose-900/40 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <FaUndo size={20} />
                      <span className="text-xs font-bold text-center">İzlemeyi Sıfırla</span>
                    </button>
                  </div>

                  {totalSeasons > 0 && Object.keys(episodesPerSeason).length > 0 && (
                    <Tab.Group>
                      <Tab.List className="flex space-x-1 rounded-xl bg-stone-100 dark:bg-zinc-900 p-1">
                        <Tab
                          className={({ selected }) =>
                            `w-full rounded-lg py-2 text-xs font-bold leading-5 transition-all
                            ${selected
                              ? 'bg-white dark:bg-zinc-800 text-sky-600 dark:text-sky-400 shadow'
                              : 'text-stone-500 dark:text-zinc-400 hover:bg-white/[0.12] hover:text-stone-700 dark:hover:text-zinc-300'
                            }`
                          }
                        >
                          Hızlı İşaretle
                        </Tab>
                        <Tab
                          className={({ selected }) =>
                            `w-full rounded-lg py-2 text-xs font-bold leading-5 transition-all
                            ${selected
                              ? 'bg-white dark:bg-zinc-800 text-sky-600 dark:text-sky-400 shadow'
                              : 'text-stone-500 dark:text-zinc-400 hover:bg-white/[0.12] hover:text-stone-700 dark:hover:text-zinc-300'
                            }`
                          }
                        >
                          Detaylı Yönetim
                        </Tab>
                      </Tab.List>
                      
                      <Tab.Panels className="mt-4">
                        {/* Hızlı İşaretle Tab */}
                        <Tab.Panel className="rounded-xl bg-stone-50 dark:bg-zinc-900/50 p-4 border border-stone-200 dark:border-zinc-800 space-y-4">
                          <p className="text-xs font-medium text-stone-500 dark:text-zinc-400 mb-2">
                            Seçtiğiniz bölüm ve önceki tüm bölümler otomatik olarak izlendi işaretlenir.
                          </p>
                          
                          <div className="flex flex-col gap-4">
                            <div>
                              <label className="block text-xs font-bold text-stone-700 dark:text-zinc-300 mb-1">Sezon Seçin</label>
                              <div className="flex flex-wrap gap-2">
                                {Array.from({ length: totalSeasons }, (_, i) => i + 1).map(season => (
                                  <button
                                    key={season}
                                    onClick={() => {
                                      setTargetSeason(season);
                                      setTargetEpisode(episodesPerSeason[season] || 1);
                                    }}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors ${
                                      targetSeason === season 
                                      ? 'bg-sky-500 text-white border-sky-600' 
                                      : 'bg-white dark:bg-zinc-800 text-stone-600 dark:text-zinc-300 border-stone-200 dark:border-zinc-700 hover:border-sky-300'
                                    }`}
                                  >
                                    Sezon {season}
                                  </button>
                                ))}
                              </div>
                            </div>
                            
                            {maxEpisodesForTarget > 0 && (
                              <div>
                                <label className="block text-xs font-bold text-stone-700 dark:text-zinc-300 mb-1">Bölüm Seçin (Sezon {targetSeason})</label>
                                <div className="flex items-center gap-3">
                                  <input 
                                    type="range" 
                                    min={1} 
                                    max={maxEpisodesForTarget} 
                                    value={targetEpisode}
                                    onChange={(e) => setTargetEpisode(parseInt(e.target.value))}
                                    className="flex-1 accent-sky-500 h-2 bg-stone-200 rounded-lg appearance-none cursor-pointer dark:bg-zinc-700"
                                  />
                                  <span className="w-10 text-center text-xs font-black text-sky-600 dark:text-sky-400">
                                    B{targetEpisode}
                                  </span>
                                </div>
                              </div>
                            )}

                            <button
                              onClick={handleMarkUpToEpisode}
                              disabled={isLoading || maxEpisodesForTarget === 0}
                              className="w-full flex items-center justify-center gap-2 py-3 mt-2 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-500 hover:from-sky-600 hover:to-indigo-600 text-white text-sm font-bold shadow-md transition-all disabled:opacity-50"
                            >
                              {isLoading ? <FaSpinner className="animate-spin" /> : <FaSave />}
                              Buraya Kadar İzledim
                            </button>
                          </div>
                        </Tab.Panel>
                        
                        {/* Detaylı Yönetim Tab */}
                        <Tab.Panel>
                           <EpisodeTracker item={item} onUpdate={refetch} compact={true} />
                        </Tab.Panel>
                      </Tab.Panels>
                    </Tab.Group>
                  )}

                  {(!totalSeasons || totalSeasons === 0) && (
                    <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800 text-sm font-medium text-center">
                      Bu dizinin sezon/bölüm bilgisi bulunmuyor. Düzenle menüsünden OMDB ile güncelleyebilirsiniz.
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
