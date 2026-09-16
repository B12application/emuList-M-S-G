// src/components/EditModal.tsx
import { useState, useEffect, Fragment } from 'react';
import type { MediaItem } from '../../backend/types/media';
import { db } from '../../backend/config/firebaseConfig';
import { doc, updateDoc } from 'firebase/firestore';
import { Dialog, Transition } from '@headlessui/react';
import {
  FaSave,
  FaLink,
  FaSpinner,
  FaTimes,
  FaTv,
  FaFilm,
  FaGamepad,
  FaBook,
  FaDownload,
  FaStar,
  FaRegStar,
  FaStarHalfAlt,
  FaStickyNote,
  FaPen,
  FaTags,
  FaAlignLeft,
  FaImage,
} from 'react-icons/fa';
import Slider from 'rc-slider';
import 'rc-slider/assets/index.css';
import { useLanguage } from '../context/LanguageContext';
import SeasonSelector from './SeasonSelector';
import EpisodeTracker from './EpisodeTracker';
import { fetchAndUpdateSeriesSeasons } from '../../backend/services/seasonMigrationService';
import toast from 'react-hot-toast';
import Portal from './ui/Portal';

interface EditModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: MediaItem;
  refetch: () => void;
}

export default function EditModal({ isOpen, onClose, item, refetch }: EditModalProps) {
  const { t } = useLanguage();
  const [editTitle, setEditTitle] = useState(item.title);
  const [editDesc, setEditDesc] = useState(item.description || '');
  const [editImage, setEditImage] = useState(item.image || '');
  const [editRating, setEditRating] = useState(item.rating || '0');
  const [editGenre, setEditGenre] = useState(item.genre || '');
  const [editTotalSeasons, setEditTotalSeasons] = useState(item.totalSeasons || 0);
  const [editWatchedSeasons, setEditWatchedSeasons] = useState<number[]>(item.watchedSeasons || []);
  const [editMyRating, setEditMyRating] = useState<number | undefined>(item.myRating ?? undefined);
  const [editMyNote, setEditMyNote] = useState(item.myNote || '');
  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingSeasons, setIsFetchingSeasons] = useState(false);
  const [showUrlInput, setShowUrlInput] = useState(false);

  const isSeries = item.type === 'series';

  useEffect(() => {
    setEditTitle(item.title);
    setEditDesc(item.description || '');
    setEditImage(item.image || '');
    setEditRating(item.rating || '0');
    setEditGenre(item.genre || '');
    setEditTotalSeasons(item.totalSeasons || 0);
    setEditWatchedSeasons(item.watchedSeasons || []);
    setEditMyRating(item.myRating ?? undefined);
    setEditMyNote(item.myNote || '');
    setShowUrlInput(false);
  }, [item, isOpen]);

  const handleSave = async () => {
    setIsLoading(true);
    try {
      const itemRef = doc(db, 'mediaItems', item.id);
      await updateDoc(itemRef, {
        title: editTitle,
        description: editDesc,
        image: editImage,
        rating: editRating,
        genre: editGenre || null,
        myRating: editMyRating ?? null,
        myNote: editMyNote.trim() || null,
        // Dizi için sezon bilgilerini kaydet
        ...(isSeries && {
          totalSeasons: editTotalSeasons || null,
          watchedSeasons: editWatchedSeasons,
          watched: editWatchedSeasons.length === editTotalSeasons && editTotalSeasons > 0,
        }),
      });
      toast.success(t('toast.updateSuccess') || 'Değişiklikler kaydedildi!');
      refetch();
      onClose();
    } catch (e) {
      console.error('Güncelleme hatası: ', e);
      toast.error(t('toast.updateError') || 'Güncelleme başarısız oldu.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSliderChange = (newValue: number | number[]) => {
    const value = Array.isArray(newValue) ? newValue[0] : newValue;
    setEditRating(String(value));
  };

  const getRatingColor = (r: string): string => {
    const val = parseFloat(r) || 0;
    if (val < 5) return '#ef4444';
    if (val < 8) return '#f59e0b';
    return '#22c55e';
  };
  const ratingColor = getRatingColor(editRating);

  const getTypeIcon = () => {
    switch (item.type) {
      case 'movie':
        return <FaFilm size={16} />;
      case 'series':
        return <FaTv size={16} />;
      case 'game':
        return <FaGamepad size={16} />;
      case 'book':
        return <FaBook size={16} />;
      default:
        return <FaPen size={16} />;
    }
  };

  return (
    <Portal>
      <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-[10000]" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-stone-900/60 dark:bg-black/80 backdrop-blur-md" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto z-[10000]">
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
              <Dialog.Panel
                onClick={(e) => e.stopPropagation()}
                className="w-full max-w-lg sm:max-w-xl transform overflow-hidden sm:rounded-3xl rounded-t-3xl bg-white dark:bg-zinc-950 border border-stone-200/90 dark:border-zinc-800/90 shadow-2xl transition-all flex flex-col max-h-[90vh] sm:max-h-[85vh]"
              >
                {/* STICKY HEADER */}
                <div className="sticky top-0 z-20 flex items-center justify-between p-4 sm:p-5 border-b border-stone-200 dark:border-zinc-800 bg-white/95 dark:bg-zinc-950/95 backdrop-blur-xl">
                  <div className="flex items-center gap-3 min-w-0 flex-1 pr-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-amber-500/15 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400 shadow-inner">
                      {getTypeIcon()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <Dialog.Title
                        as="h3"
                        className="text-base sm:text-lg font-black text-stone-900 dark:text-white line-clamp-1"
                      >
                        {editTitle || item.title}
                      </Dialog.Title>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-amber-700 dark:text-amber-400">
                          {item.type === 'movie'
                            ? t('media.movie')
                            : item.type === 'series'
                              ? t('media.series')
                              : item.type === 'game'
                                ? t('media.game')
                                : t('media.book')}
                        </span>
                        <span className="text-xs font-semibold text-stone-400 dark:text-zinc-500">
                          {t('actions.edit')}
                        </span>
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={onClose}
                    className="flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-full bg-stone-100 dark:bg-zinc-900 text-stone-500 dark:text-zinc-400 hover:bg-stone-200 dark:hover:bg-zinc-800 hover:text-stone-900 dark:hover:text-white transition-colors cursor-pointer"
                    title={t('common.close') || 'Kapat'}
                  >
                    <FaTimes size={14} />
                  </button>
                </div>

                {/* SCROLLABLE BODY */}
                <div className="flex-1 overflow-y-auto custom-scrollbar p-4 sm:p-6 space-y-5">
                  {/* Görsel Önizleme ve URL Değiştirme */}
                  <div className="flex items-center gap-3.5 p-3 rounded-2xl bg-stone-50 dark:bg-zinc-900/60 border border-stone-200 dark:border-zinc-800">
                    <div className="w-14 h-20 shrink-0 rounded-xl overflow-hidden bg-stone-200 dark:bg-zinc-800 relative shadow-inner">
                      {editImage ? (
                        <img
                          src={editImage}
                          alt="Poster Preview"
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.currentTarget as HTMLImageElement).style.display = 'none';
                          }}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-stone-400 dark:text-zinc-600">
                          <FaImage size={18} />
                        </div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-1.5">
                        <span className="text-xs font-bold uppercase tracking-wider text-stone-700 dark:text-zinc-300 flex items-center gap-1.5">
                          <FaImage className="text-amber-500" />
                          {t('create.imageLabel')}
                        </span>
                        {!showUrlInput && (
                          <button
                            type="button"
                            onClick={() => setShowUrlInput(true)}
                            className="text-xs font-bold text-amber-600 hover:text-amber-500 dark:text-amber-400 flex items-center gap-1 transition cursor-pointer"
                          >
                            <FaLink size={10} /> {t('modal.changeImage')}
                          </button>
                        )}
                      </div>

                      {showUrlInput ? (
                        <div className="flex gap-2 items-center">
                          <input
                            type="url"
                            id="editImage"
                            value={editImage}
                            onChange={(e) => setEditImage(e.target.value)}
                            placeholder="https://..."
                            className="w-full px-3 py-1.5 rounded-xl border border-stone-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-stone-900 dark:text-white placeholder:text-stone-400 dark:placeholder:text-zinc-600 text-xs font-medium focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                            autoFocus
                          />
                          <button
                            type="button"
                            onClick={() => setShowUrlInput(false)}
                            className="p-1.5 rounded-lg text-stone-500 hover:bg-stone-200 dark:hover:bg-zinc-800 transition cursor-pointer shrink-0"
                            title={t('common.close') || 'Kapat'}
                          >
                            <FaTimes size={12} />
                          </button>
                        </div>
                      ) : (
                        <p className="text-xs text-stone-500 dark:text-zinc-400 truncate">
                          {editImage || 'Görsel tanımlı değil'}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Başlık */}
                  <div>
                    <label
                      htmlFor="editTitle"
                      className="block text-xs font-bold uppercase tracking-wider mb-1.5 text-stone-700 dark:text-zinc-300 flex items-center gap-1.5"
                    >
                      <FaPen className="text-amber-500 text-[10px]" />
                      {t('create.titleLabel')}
                    </label>
                    <input
                      type="text"
                      id="editTitle"
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-2xl border border-stone-200 dark:border-zinc-800 bg-stone-50 dark:bg-zinc-900/90 text-stone-900 dark:text-white placeholder:text-stone-400 dark:placeholder:text-zinc-600 text-sm font-semibold focus:outline-none focus:border-amber-500 dark:focus:border-amber-400 focus:ring-2 focus:ring-amber-500/20 transition-all"
                    />
                  </div>

                  {/* Açıklama */}
                  <div>
                    <label
                      htmlFor="editDesc"
                      className="block text-xs font-bold uppercase tracking-wider mb-1.5 text-stone-700 dark:text-zinc-300 flex items-center gap-1.5"
                    >
                      <FaAlignLeft className="text-amber-500 text-[10px]" />
                      {t('create.descriptionLabel')}
                    </label>
                    <textarea
                      id="editDesc"
                      rows={3}
                      value={editDesc}
                      onChange={(e) => setEditDesc(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-2xl border border-stone-200 dark:border-zinc-800 bg-stone-50 dark:bg-zinc-900/90 text-stone-900 dark:text-white placeholder:text-stone-400 dark:placeholder:text-zinc-600 text-sm leading-relaxed focus:outline-none focus:border-amber-500 dark:focus:border-amber-400 focus:ring-2 focus:ring-amber-500/20 transition-all resize-y"
                    />
                  </div>

                  {/* Genel Puan Slider */}
                  <div className="p-3.5 rounded-2xl bg-stone-50 dark:bg-zinc-900/60 border border-stone-200 dark:border-zinc-800">
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-xs font-bold uppercase tracking-wider text-stone-700 dark:text-zinc-300 flex items-center gap-1.5">
                        <FaStar className="text-amber-500" />
                        {t('create.ratingLabel')}
                      </label>
                      <span
                        className="px-2.5 py-0.5 rounded-lg text-xs font-black shadow-xs"
                        style={{ backgroundColor: `${ratingColor}22`, color: ratingColor }}
                      >
                        ★ {editRating}
                      </span>
                    </div>
                    <div className="px-1 py-1">
                      <Slider
                        value={parseFloat(editRating) || 0}
                        onChange={handleSliderChange}
                        min={0}
                        max={9.9}
                        step={0.1}
                        trackStyle={{ backgroundColor: ratingColor, height: 6, borderRadius: 999 }}
                        handleStyle={{
                          borderColor: ratingColor,
                          backgroundColor: '#ffffff',
                          height: 18,
                          width: 18,
                          marginTop: -6,
                          opacity: 1,
                          boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
                        }}
                        railStyle={{ backgroundColor: '#71717a44', height: 6, borderRadius: 999 }}
                      />
                    </div>
                  </div>

                  {/* Kişisel Puan & Not */}
                  <div className="p-3.5 rounded-2xl bg-amber-50/50 dark:bg-amber-950/15 border border-amber-200/60 dark:border-amber-900/30 space-y-3.5">
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="text-xs font-bold uppercase tracking-wider text-amber-900 dark:text-amber-300 flex items-center gap-1.5">
                          ⭐ {t('personal.myRating') || 'Kişisel Puanım'}
                        </label>
                        <span className="font-black text-sm text-amber-600 dark:text-amber-400">
                          {editMyRating != null ? editMyRating.toFixed(1) : '—'}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 py-1">
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((star) => {
                          const val = star;
                          const filled = editMyRating !== undefined && editMyRating >= val;
                          const halfFilled =
                            editMyRating !== undefined && editMyRating >= val - 0.5 && editMyRating < val;
                          return (
                            <button
                              key={star}
                              type="button"
                              onClick={() => setEditMyRating((prev) => (prev === val ? undefined : val))}
                              onContextMenu={(e) => {
                                e.preventDefault();
                                setEditMyRating(val - 0.5);
                              }}
                              className="text-lg sm:text-xl transition-transform hover:scale-125 focus:outline-none cursor-pointer"
                              title={`${val} (sağ tık: ${val - 0.5})`}
                            >
                              {filled ? (
                                <FaStar className="text-amber-400 drop-shadow-xs" />
                              ) : halfFilled ? (
                                <FaStarHalfAlt className="text-amber-400 drop-shadow-xs" />
                              ) : (
                                <FaRegStar className="text-stone-300 dark:text-zinc-700 hover:text-amber-300" />
                              )}
                            </button>
                          );
                        })}
                        {editMyRating !== undefined && (
                          <button
                            type="button"
                            onClick={() => setEditMyRating(undefined)}
                            className="ml-2 text-xs text-stone-400 hover:text-rose-500 transition-colors cursor-pointer"
                            title="Puanı Sıfırla"
                          >
                            <FaTimes />
                          </button>
                        )}
                      </div>
                    </div>

                    <div>
                      <label
                        htmlFor="editMyNote"
                        className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider mb-1 text-amber-900 dark:text-amber-300"
                      >
                        <FaStickyNote className="text-amber-500 text-xs" /> {t('personal.myNote')}
                      </label>
                      <textarea
                        id="editMyNote"
                        rows={2}
                        maxLength={200}
                        value={editMyNote}
                        onChange={(e) => setEditMyNote(e.target.value)}
                        placeholder={t('personal.myNotePlaceholder')}
                        className="w-full px-3.5 py-2 rounded-xl border border-amber-200/80 dark:border-amber-900/40 bg-white dark:bg-zinc-900 text-stone-900 dark:text-white placeholder:text-stone-400 dark:placeholder:text-zinc-600 text-xs resize-none focus:outline-none focus:ring-1 focus:ring-amber-500"
                      />
                      <p className="text-[10px] text-stone-400 dark:text-zinc-500 text-right mt-0.5">
                        {editMyNote.length}/200
                      </p>
                    </div>
                  </div>

                  {/* Türler */}
                  <div>
                    <label
                      htmlFor="editGenre"
                      className="block text-xs font-bold uppercase tracking-wider mb-1.5 text-stone-700 dark:text-zinc-300 flex items-center gap-1.5"
                    >
                      <FaTags className="text-amber-500 text-[10px]" />
                      {t('create.genreLabel')}
                    </label>
                    <input
                      type="text"
                      id="editGenre"
                      value={editGenre}
                      onChange={(e) => setEditGenre(e.target.value)}
                      placeholder={t('create.genrePlaceholder')}
                      className="w-full px-4 py-2.5 rounded-2xl border border-stone-200 dark:border-zinc-800 bg-stone-50 dark:bg-zinc-900/90 text-stone-900 dark:text-white placeholder:text-stone-400 dark:placeholder:text-zinc-600 text-sm font-medium focus:outline-none focus:border-amber-500 dark:focus:border-amber-400 focus:ring-2 focus:ring-amber-500/20 transition-all"
                    />
                  </div>

                  {/* Sezon Düzenleme - Sadece diziler için */}
                  {isSeries && (
                    <div className="border-t border-stone-200 dark:border-zinc-800 pt-4 space-y-4">
                      <div>
                        <label
                          htmlFor="editTotalSeasons"
                          className="block text-xs font-bold uppercase tracking-wider mb-1.5 text-stone-700 dark:text-zinc-300 flex items-center gap-2"
                        >
                          <FaTv className="text-purple-500" />
                          {t('seasons.totalSeasons')}
                        </label>
                        <div className="flex gap-2">
                          <input
                            type="number"
                            id="editTotalSeasons"
                            value={editTotalSeasons || ''}
                            onChange={(e) => {
                              const val = parseInt(e.target.value, 10) || 0;
                              setEditTotalSeasons(val);
                              setEditWatchedSeasons((prev) => prev.filter((s) => s <= val));
                            }}
                            min={0}
                            max={50}
                            className="flex-1 px-4 py-2 rounded-xl border border-stone-200 dark:border-zinc-800 bg-stone-50 dark:bg-zinc-900 text-stone-900 dark:text-white text-sm font-bold focus:outline-none focus:ring-1 focus:ring-purple-500"
                          />
                          {/* OMDB'den Çek Butonu */}
                          <button
                            type="button"
                            onClick={async () => {
                              setIsFetchingSeasons(true);
                              try {
                                const result = await fetchAndUpdateSeriesSeasons(item.id, editTitle);
                                if (result.success && result.totalSeasons) {
                                  setEditTotalSeasons(result.totalSeasons);
                                  toast.success(`${result.totalSeasons} sezon bulundu!`);
                                } else {
                                  toast.error('Sezon bilgisi bulunamadı');
                                }
                              } catch (error) {
                                toast.error('OMDB hatası');
                              } finally {
                                setIsFetchingSeasons(false);
                              }
                            }}
                            disabled={isFetchingSeasons}
                            className="px-3.5 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl transition-colors disabled:opacity-50 flex items-center gap-2 text-xs font-bold cursor-pointer"
                            title="OMDB'den sezon bilgisi çek"
                          >
                            {isFetchingSeasons ? <FaSpinner className="animate-spin" /> : <FaDownload />}
                            <span>OMDb</span>
                          </button>
                        </div>
                      </div>

                      {editTotalSeasons > 0 && (
                        <SeasonSelector
                          totalSeasons={editTotalSeasons}
                          watchedSeasons={editWatchedSeasons}
                          onChange={setEditWatchedSeasons}
                        />
                      )}

                      {/* Bölüm Takibi - EpisodeTracker */}
                      {editTotalSeasons > 0 && item.imdbId && (
                        <div className="border-t border-stone-200 dark:border-zinc-800 pt-4 mt-4">
                          <EpisodeTracker item={item} onUpdate={refetch} />
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* STICKY FOOTER */}
                <div className="sticky bottom-0 z-20 flex items-center justify-end gap-3 p-4 sm:px-6 sm:py-3.5 border-t border-stone-200 dark:border-zinc-800 bg-white/95 dark:bg-zinc-950/95 backdrop-blur-xl">
                  <button
                    type="button"
                    className="px-5 py-2.5 rounded-xl bg-stone-100 dark:bg-zinc-800 text-stone-700 dark:text-zinc-300 text-sm font-bold hover:bg-stone-200 dark:hover:bg-zinc-700 transition-colors cursor-pointer"
                    onClick={onClose}
                  >
                    {t('actions.cancel')}
                  </button>
                  <button
                    type="button"
                    disabled={isLoading}
                    className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-stone-950 text-sm font-black disabled:opacity-50 transition-all shadow-md shadow-amber-500/20 active:scale-95 cursor-pointer"
                    onClick={handleSave}
                  >
                    {isLoading ? <FaSpinner className="animate-spin" /> : <FaSave />}
                    <span>{t('actions.save')}</span>
                  </button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
    </Portal>
  );
}