import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaChevronDown, FaChevronUp, FaLightbulb, FaSpinner, FaStar, FaFilm, FaTv, FaGamepad, FaBook } from 'react-icons/fa';
import type { MediaItem } from '../../../backend/types/media';
import { useLanguage } from '../../context/LanguageContext';

type TFn = (key: string) => string;

interface HomeCollectionPicksProps {
    expanded: boolean;
    onToggle: () => void;
    loading: boolean;
    movie: MediaItem | undefined;
    series: MediaItem | undefined;
    game: MediaItem | undefined;
    book: MediaItem | undefined;
    refetch: () => void;
    t: TFn;
}

const picks = [
    { key: 'movie', icon: FaFilm, label: 'Film', color: 'sky' },
    { key: 'series', icon: FaTv, label: 'Dizi', color: 'emerald' },
    { key: 'game', icon: FaGamepad, label: 'Oyun', color: 'amber' },
    { key: 'book', icon: FaBook, label: 'Kitap', color: 'violet' },
] as const;

export default function HomeCollectionPicks({
    expanded,
    onToggle,
    loading,
    movie,
    series,
    game,
    book,
    refetch,
    t,
}: HomeCollectionPicksProps) {
    const { t: translate } = useLanguage();
    const items = { movie, series, game, book };
    const hasAnyItem = Object.values(items).some(Boolean);
    const [activeDetail, setActiveDetail] = useState<string | null>(null);

    const getTranslatedLabel = (label: string) => {
        if (label === 'Film') return translate('media.movie');
        if (label === 'Dizi') return translate('media.series');
        if (label === 'Oyun') return translate('media.game');
        if (label === 'Kitap') return translate('media.book');
        return label;
    };

    return (
        <section className="mt-10">
            {/* Header */}
            <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-50 dark:bg-amber-950/50 text-amber-500">
                        <FaLightbulb size={16} />
                    </div>
                    <div>
                        <h2 className="text-lg font-bold text-slate-800 dark:text-white leading-tight">
                            {t('home.collectionRecommendations')}
                        </h2>
                        <p className="text-xs text-slate-400 dark:text-zinc-500">
                            {t('home.recommendations')}
                        </p>
                    </div>
                </div>
                <button
                    type="button"
                    onClick={onToggle}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium text-slate-500 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors"
                >
                    {expanded ? t('home.collapseRecs') : t('home.expandRecs')}
                    {expanded ? <FaChevronUp size={10} /> : <FaChevronDown size={10} />}
                </button>
            </div>

            {/* Content */}
            <AnimatePresence>
                {expanded && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.3 }}
                    >
                        {loading ? (
                            <div className="flex items-center justify-center gap-3 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 py-20">
                                <FaSpinner className="animate-spin text-slate-300 dark:text-zinc-600" size={20} />
                                <span className="text-sm text-slate-400 dark:text-zinc-500">{t('home.recommendationsLoading')}</span>
                            </div>
                        ) : !hasAnyItem ? (
                            <div className="rounded-2xl bg-white dark:bg-zinc-900 border border-dashed border-slate-200 dark:border-zinc-800 py-16 text-center">
                                <FaLightbulb size={32} className="mx-auto text-slate-200 dark:text-zinc-700 mb-3" />
                                <p className="text-sm text-slate-400 dark:text-zinc-500">
                                    {t('home.noRecommendations') || 'Henüz öneri yok'}
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {picks.map((pick) => {
                                    const PickIcon = pick.icon;
                                    const item = items[pick.key];
                                    const isActive = activeDetail === pick.key;

                                    if (!item) {
                                        return (
                                            <div
                                                key={pick.key}
                                                className="flex items-center gap-3 p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-dashed border-slate-200 dark:border-zinc-800 opacity-50"
                                            >
                                                <div className={`w-10 h-10 rounded-xl bg-${pick.color}-50 dark:bg-${pick.color}-950/30 flex items-center justify-center shrink-0`}>
                                                    <PickIcon size={18} className={`text-${pick.color}-400`} />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-medium text-slate-400 dark:text-zinc-500">
                                                        {getTranslatedLabel(pick.label)}
                                                    </p>
                                                    <p className="text-xs text-slate-300 dark:text-zinc-600">
                                                        {t('home.noRecommendation') || 'öneri yok'}
                                                    </p>
                                                </div>
                                            </div>
                                        );
                                    }

                                    return (
                                        <div
                                            key={pick.key}
                                            className={`rounded-2xl bg-white dark:bg-zinc-900 border transition-all duration-200 ${isActive
                                                ? 'border-slate-300 dark:border-zinc-700 shadow-md'
                                                : 'border-slate-100 dark:border-zinc-800 hover:border-slate-200 dark:hover:border-zinc-700'
                                                }`}
                                        >
                                            {/* Ana Satır - Kapalıyken küçük fotoğraf var */}
                                            <div
                                                onClick={() => setActiveDetail(isActive ? null : pick.key)}
                                                className="flex items-center gap-3 p-3 cursor-pointer"
                                            >
                                                {/* Küçük Thumbnail */}
                                                <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl overflow-hidden bg-slate-100 dark:bg-zinc-800 shrink-0">
                                                    {item.image ? (
                                                        <img
                                                            src={item.image}
                                                            alt={item.title}
                                                            className="w-full h-full object-cover"
                                                        />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center">
                                                            <PickIcon size={20} className="text-slate-300 dark:text-zinc-600" />
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Bilgi */}
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2 mb-0.5">
                                                        <span className={`text-[10px] font-bold text-${pick.color}-500 dark:text-${pick.color}-400`}>
                                                            {getTranslatedLabel(pick.label)}
                                                        </span>
                                                        <span className="flex items-center gap-1 text-[10px] text-amber-500 font-bold">
                                                            <FaStar size={8} /> {item.rating}
                                                        </span>
                                                    </div>
                                                    <h4 className="text-sm font-bold text-slate-800 dark:text-white truncate">
                                                        {item.title}
                                                    </h4>
                                                </div>

                                                {/* Ok */}
                                                <FaChevronDown
                                                    size={12}
                                                    className={`text-slate-300 dark:text-zinc-600 shrink-0 transition-transform duration-300 ${isActive ? 'rotate-180' : ''
                                                        }`}
                                                />
                                            </div>

                                            {/* Genişleyen Detay - FOTOĞRAF YOK */}
                                            <AnimatePresence>
                                                {isActive && (
                                                    <motion.div
                                                        initial={{ height: 0, opacity: 0 }}
                                                        animate={{ height: 'auto', opacity: 1 }}
                                                        exit={{ height: 0, opacity: 0 }}
                                                        transition={{ duration: 0.2 }}
                                                        className="overflow-hidden"
                                                    >
                                                        <div className="px-4 pb-4 mx-4 border-t border-slate-50 dark:border-zinc-800">
                                                            {/* Meta Bilgiler */}
                                                            <div className="flex flex-wrap items-center gap-3 mt-3 mb-2">
                                                                {item.releaseDate && (
                                                                    <span className="text-[10px] text-slate-400 dark:text-zinc-500">
                                                                        📅 {item.releaseDate}
                                                                    </span>
                                                                )}
                                                                {item.runtime && (
                                                                    <span className="text-[10px] text-slate-400 dark:text-zinc-500">
                                                                        ⏱ {item.runtime}
                                                                    </span>
                                                                )}
                                                                {item.myRating && (
                                                                    <span className="text-[10px] font-bold text-rose-500">
                                                                        ⭐ {item.myRating}
                                                                    </span>
                                                                )}
                                                            </div>

                                                            {/* Türler */}
                                                            {item.genre && (
                                                                <div className="flex flex-wrap gap-1.5 mb-3">
                                                                    {item.genre.split(', ').map((g, idx) => (
                                                                        <span
                                                                            key={idx}
                                                                            className="px-2 py-0.5 rounded-md text-[9px] font-bold uppercase bg-slate-50 dark:bg-zinc-800 text-slate-500 dark:text-zinc-400"
                                                                        >
                                                                            {g.trim()}
                                                                        </span>
                                                                    ))}
                                                                </div>
                                                            )}

                                                            {/* Açıklama */}
                                                            <p className="text-xs sm:text-sm text-slate-500 dark:text-zinc-400 leading-relaxed mb-3">
                                                                {item.description || 'Açıklama yok'}
                                                            </p>

                                                            {/* IMDb */}
                                                            {item.imdbId && (
                                                                <a
                                                                    href={`https://www.imdb.com/title/${item.imdbId}/`}
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#f5c518] hover:bg-[#e2b616] text-black text-xs font-bold transition-colors"
                                                                >
                                                                    <FaFilm size={12} /> IMDb'de Görüntüle
                                                                </a>
                                                            )}
                                                        </div>
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </section>
    );
}