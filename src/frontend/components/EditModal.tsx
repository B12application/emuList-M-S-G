// src/components/EditModal.tsx
import { useState, useEffect, Fragment } from 'react';
import type { MediaItem } from '../../backend/types/media';
import { db } from '../../backend/config/firebaseConfig';
import { doc, updateDoc } from 'firebase/firestore';
import { Dialog, Transition } from '@headlessui/react';
import { FaSave, FaLink, FaSpinner, FaTimes, FaTv, FaDownload, FaStar, FaRegStar, FaStarHalfAlt, FaStickyNote } from 'react-icons/fa';
import Slider from 'rc-slider';
import 'rc-slider/assets/index.css';
import { useLanguage } from '../context/LanguageContext';
import SeasonSelector from './SeasonSelector';
import EpisodeTracker from './EpisodeTracker';
import { fetchAndUpdateSeriesSeasons } from '../../backend/services/seasonMigrationService';
import toast from 'react-hot-toast';

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
  const [editMyRating, setEditMyRating] = useState<number | undefined>(item.myRating);
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
    setEditMyRating(item.myRating);
    setEditMyNote(item.myNote || '');
    setShowUrlInput(false);
  }, [item, isOpen]);

  const handleSave = async () => {
    setIsLoading(true);
    try {
      const itemRef = doc(db, "mediaItems", item.id);
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
          watched: editWatchedSeasons.length === editTotalSeasons && editTotalSeasons > 0
        })
      });
      refetch();
      onClose();
    } catch (e) {
      console.error("Güncelleme hatası: ", e);
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

  return (
    <Transition appear show={isOpen} as={Fragment}>
      {/* 'onClose' sadece dışarı (backdrop) tıklandığında çalışır */}
      <Dialog as="div" className="relative z-50" onClose={onClose}>

        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              // 1. DÜZELTME: 'scale' (Zoom) efektleri kaldırıldı. Sadece Opacity ve Translate kaldı.
              enter="ease-out duration-300"
              enterFrom="opacity-0 translate-y-4"
              enterTo="opacity-100 translate-y-0"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 translate-y-0"
              leaveTo="opacity-0 translate-y-4"
            >
              <Dialog.Panel
                // 2. DÜZELTME: 'onClick={e => e.stopPropagation()}'
                // Bu, modalın içine yapılan tıklamaların dışarı sızmasını ve diğer şeyleri tetiklemesini engeller.
                onClick={(e) => e.stopPropagation()}
                className="w-full max-w-lg transform overflow-hidden rounded-2xl bg-white dark:bg-gray-800 p-6 text-left align-middle shadow-xl transition-all max-h-[90vh] overflow-y-auto"
              >
                <Dialog.Title
                  as="h3"
                  className="text-lg font-medium leading-6 text-gray-900 dark:text-white"
                >
                  {t('modal.editTitle').replace('{title}', item.title)}
                </Dialog.Title>

                <div className="mt-4 flex flex-col gap-4">
                  <div>
                    <label htmlFor="editTitle" className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                      {t('create.titleLabel')}
                    </label>
                    <input
                      type="text" id="editTitle" value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      className="w-full px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900"
                    />
                  </div>

                  <div>
                    <label htmlFor="editDesc" className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                      {t('create.descriptionLabel')}
                    </label>
                    <textarea
                      id="editDesc" rows={3} value={editDesc}
                      onChange={(e) => setEditDesc(e.target.value)}
                      className="w-full px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                      {t('create.ratingLabel')}: <span className="font-bold">{editRating}</span>
                    </label>
                    <div className="px-1">
                      <Slider
                        value={parseFloat(editRating) || 0}
                        onChange={handleSliderChange}
                        min={0} max={9.9} step={0.1}
                        trackStyle={{ backgroundColor: ratingColor, height: 6 }}
                        handleStyle={{ borderColor: ratingColor, backgroundColor: 'white', height: 18, width: 18, marginTop: -6, opacity: 1 }}
                        railStyle={{ backgroundColor: '#4b5563', height: 6 }}
                      />
                    </div>
                  </div>

                  {/* ── Kişisel Puan & Not (sadece izlenenler için) ── */}
                  {item.watched && (
                    <>
                      <div className="border-t border-gray-200 dark:border-gray-700 pt-3">
                        <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                          ⭐ {t('personal.myRating')}: <span className="font-bold text-amber-500">{editMyRating !== undefined ? editMyRating.toFixed(1) : '—'}</span>
                        </label>
                        <div className="flex items-center gap-1">
                          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(star => {
                            const val = star;
                            const filled = editMyRating !== undefined && editMyRating >= val;
                            const halfFilled = editMyRating !== undefined && editMyRating >= val - 0.5 && editMyRating < val;
                            return (
                              <button
                                key={star}
                                type="button"
                                onClick={() => setEditMyRating(prev => prev === val ? undefined : val)}
                                onContextMenu={(e) => { e.preventDefault(); setEditMyRating(val - 0.5); }}
                                className="text-xl transition-transform hover:scale-125 focus:outline-none"
                                title={`${val} (sağ tık: ${val - 0.5})`}
                              >
                                {filled ? <FaStar className="text-amber-400" /> : halfFilled ? <FaStarHalfAlt className="text-amber-400" /> : <FaRegStar className="text-gray-300 dark:text-gray-600" />}
                              </button>
                            );
                          })}
                          {editMyRating !== undefined && (
                            <button type="button" onClick={() => setEditMyRating(undefined)} className="ml-2 text-xs text-gray-400 hover:text-red-400 transition-colors">
                              <FaTimes />
                            </button>
                          )}
                        </div>
                      </div>

                      <div>
                        <label htmlFor="editMyNote" className="flex items-center gap-1.5 text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                          <FaStickyNote className="text-amber-500 text-xs" /> {t('personal.myNote')}
                        </label>
                        <textarea
                          id="editMyNote"
                          rows={2}
                          maxLength={200}
                          value={editMyNote}
                          onChange={(e) => setEditMyNote(e.target.value)}
                          placeholder={t('personal.myNotePlaceholder')}
                          className="w-full px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm resize-none"
                        />
                        <p className="text-[10px] text-gray-400 text-right mt-0.5">{editMyNote.length}/200</p>
                      </div>
                    </>
                  )}

                  <div>
                    <label htmlFor="editGenre" className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                      {t('create.genreLabel')}
                    </label>
                    <input
                      type="text" id="editGenre" value={editGenre}
                      onChange={(e) => setEditGenre(e.target.value)}
                      placeholder={t('create.genrePlaceholder')}
                      className="w-full px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900"
                    />
                  </div>

                  {/* Sezon Düzenleme - Sadece diziler için */}
                  {isSeries && (
                    <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                      <div className="mb-3">
                        <label htmlFor="editTotalSeasons" className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300 flex items-center gap-2">
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
                              // Sezon sayısı azaldıysa, izlenen sezonları filtrele
                              setEditWatchedSeasons(prev => prev.filter(s => s <= val));
                            }}
                            min={0}
                            max={50}
                            className="flex-1 px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900"
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
                            className="px-3 py-2 bg-purple-500 text-white rounded-xl hover:bg-purple-600 transition-colors disabled:opacity-50 flex items-center gap-2"
                            title="OMDB'den sezon bilgisi çek"
                          >
                            {isFetchingSeasons ? <FaSpinner className="animate-spin" /> : <FaDownload />}
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
                        <div className="border-t border-gray-200 dark:border-gray-700 pt-4 mt-4">
                          <EpisodeTracker item={item} onUpdate={refetch} />
                        </div>
                      )}
                    </div>
                  )}

                  <div>
                    {!showUrlInput ? (
                      <button
                        type="button"
                        onClick={() => setShowUrlInput(true)}
                        className="flex items-center gap-2 text-sky-600 hover:text-sky-500 text-sm font-medium transition"
                      >
                        <FaLink /> {t('modal.changeImage')}
                      </button>
                    ) : (
                      <div className="flex gap-2 items-center animate-fadeIn">
                        <div className="flex-1">
                          <label htmlFor="editImage" className="sr-only">{t('create.imageLabel')}</label>
                          <input
                            type="url"
                            id="editImage"
                            value={editImage}
                            onChange={(e) => setEditImage(e.target.value)}
                            placeholder="https://..."
                            className="w-full px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm"
                            autoFocus
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => setShowUrlInput(false)}
                          className="p-2 rounded-full text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                          title={t('common.close') || 'Kapat'}
                        >
                          <FaTimes />
                        </button>
                      </div>
                    )}
                  </div>

                </div>

                <div className="mt-6 flex justify-end gap-3">
                  <button
                    type="button"
                    className="px-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white text-sm font-medium hover:bg-gray-200 dark:hover:bg-gray-600"
                    onClick={onClose}
                  >
                    {t('actions.cancel')}
                  </button>
                  <button
                    type="button"
                    disabled={isLoading}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-sky-600 text-white text-sm font-medium hover:bg-sky-700 disabled:opacity-50"
                    onClick={handleSave}
                  >
                    {isLoading ? <FaSpinner className="animate-spin" /> : <FaSave />}
                    {t('actions.save')}
                  </button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}