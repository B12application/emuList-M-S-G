// src/components/EditModal.tsx
import { useState, useEffect, Fragment } from 'react';
import type { MediaItem } from '../types/media';
import { db } from '../firebaseConfig';
import { doc, updateDoc } from 'firebase/firestore';
import { Dialog, Transition } from '@headlessui/react';
import { FaSave, FaLink, FaSpinner, FaTimes } from 'react-icons/fa';
import Slider from 'rc-slider';
import 'rc-slider/assets/index.css';
import { useLanguage } from '../context/LanguageContext';

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
  const [isLoading, setIsLoading] = useState(false);
  const [showUrlInput, setShowUrlInput] = useState(false);

  useEffect(() => {
    setEditTitle(item.title);
    setEditDesc(item.description || '');
    setEditImage(item.image || '');
    setEditRating(item.rating || '0');
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
        rating: editRating
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
                className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white dark:bg-gray-800 p-6 text-left align-middle shadow-xl transition-all"
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