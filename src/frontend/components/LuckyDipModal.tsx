import { Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import type { MediaItem } from '../../backend/types/media';
import { FaTimes, FaRedo, FaPlus, FaStar } from 'react-icons/fa';
import ImageWithFallback from './ui/ImageWithFallback';
import { useLanguage } from '../context/LanguageContext';

interface LuckyDipModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSpinAgain: () => void;
    onAddToCollection: (item: MediaItem) => void;
    item: MediaItem | null;
    isAdding?: boolean;
}

export default function LuckyDipModal({
    isOpen,
    onClose,
    onSpinAgain,
    onAddToCollection,
    item,
    isAdding = false
}: LuckyDipModalProps) {
    const { t } = useLanguage();

    if (!item) return null;

    return (
        <Transition appear show={isOpen} as={Fragment}>
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
                    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm" />
                </Transition.Child>

                <div className="fixed inset-0 overflow-y-auto">
                    <div className="flex min-h-full items-center justify-center p-4 text-center">
                        <Transition.Child
                            as={Fragment}
                            enter="ease-out duration-300"
                            enterFrom="opacity-0 scale-95"
                            enterTo="opacity-100 scale-100"
                            leave="ease-in duration-200"
                            leaveFrom="opacity-100 scale-100"
                            leaveTo="opacity-0 scale-95"
                        >
                            <Dialog.Panel className="w-full max-w-lg transform overflow-hidden rounded-3xl bg-white dark:bg-gray-900 p-0 text-left align-middle shadow-2xl transition-all border border-gray-200 dark:border-gray-800 relative">

                                {/* Close Button */}
                                <button
                                    onClick={onClose}
                                    className="absolute top-4 right-4 z-10 p-2 rounded-full bg-black/20 hover:bg-black/40 text-white transition-colors"
                                >
                                    <FaTimes />
                                </button>

                                {/* Content */}
                                <div className="relative">
                                    {/* Confetti / Sparkle Effect Background (Static CSS) */}
                                    <div className="absolute inset-0 bg-linear-to-b from-purple-500/20 to-transparent pointer-events-none" />

                                    <div className="flex flex-col items-center pt-8 pb-8 px-6">

                                        <h3 className="text-2xl font-black text-gray-900 dark:text-white mb-6 uppercase tracking-wider">
                                            {t('home.luckyDipTitle') || 'Şansına Bu Çıktı!'}
                                        </h3>

                                        {/* Image Card */}
                                        <div className="relative w-48 h-72 rounded-xl shadow-2xl overflow-hidden mb-6 transform hover:scale-105 transition-transform duration-500 border-4 border-white dark:border-gray-800 ring-4 ring-purple-500/30">
                                            <ImageWithFallback
                                                src={item.image}
                                                alt={item.title}
                                                className="w-full h-full object-cover"
                                            />
                                            <div className="absolute top-2 right-2 bg-black/60 text-white text-xs font-bold px-2 py-1 rounded-md flex items-center gap-1 backdrop-blur-sm">
                                                <FaStar className="text-yellow-400" /> {item.rating}
                                            </div>
                                            <div className="absolute bottom-0 left-0 right-0 bg-linear-to-t from-black/90 to-transparent p-3 pt-8">
                                                <span className="text-white text-sm font-bold block text-center truncate">
                                                    {item.type.toUpperCase()}
                                                </span>
                                            </div>
                                        </div>

                                        <h2 className="text-3xl font-bold text-center text-gray-900 dark:text-white mb-2 leading-tight">
                                            {item.title}
                                        </h2>

                                        {item.description && (
                                            <p className="text-center text-gray-600 dark:text-gray-400 text-sm mb-8 line-clamp-3 max-w-md">
                                                {item.description}
                                            </p>
                                        )}

                                        {/* Actions */}
                                        <div className="flex flex-col sm:flex-row gap-4 w-full justify-center">
                                            <button
                                                onClick={onSpinAgain}
                                                className="flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 font-bold hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                                            >
                                                <FaRedo className={isAdding ? 'animate-spin' : ''} />
                                                {t('home.spinAgain') || 'Tekrar Dene'}
                                            </button>

                                            <button
                                                onClick={() => onAddToCollection(item)}
                                                disabled={isAdding}
                                                className="flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-purple-600 text-white font-bold hover:bg-purple-700 shadow-lg shadow-purple-500/30 hover:shadow-purple-500/50 transition-all transform hover:-translate-y-0.5 disabled:opacity-70 disabled:cursor-not-allowed"
                                            >
                                                {isAdding ? (
                                                    <span className="flex items-center gap-2">Ekleniyor...</span>
                                                ) : (
                                                    <>
                                                        <FaPlus /> {t('home.add') || 'Listeme Ekle'}
                                                    </>
                                                )}
                                            </button>
                                        </div>

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
