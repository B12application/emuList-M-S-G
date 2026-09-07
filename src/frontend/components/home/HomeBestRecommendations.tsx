import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    FaStar,
    FaCog,
    FaSpinner,
    FaPlus,
    FaCheck,
    FaChevronLeft,
    FaChevronRight,
    FaMagic,
    FaFilm,
    FaBookmark,
} from 'react-icons/fa';
import type { Recommendation } from '../../../backend/types/recommendation';
import type { MediaItem } from '../../../backend/types/media';
import { normalizeMediaTitle } from '../../../backend/services/mediaDeduplicationService';

type TFn = (key: string) => string;

interface HomeBestRecommendationsProps {
    recommendations: Recommendation[];
    recsLoading: boolean;
    recsExpanded?: boolean;
    setRecsExpanded?: (v: boolean) => void;
    userUid: string | undefined;
    adminUid: string;
    onOpenAdmin: () => void;
    handleAddToCollection: (rec: Recommendation) => Promise<void>;
    existingItems?: MediaItem[];
    recFilmPage?: number;
    setRecFilmPage?: React.Dispatch<React.SetStateAction<number>>;
    recSeriesPage?: number;
    setRecSeriesPage?: React.Dispatch<React.SetStateAction<number>>;
    recsPerPage?: number;
    t: TFn;
}

export default function HomeBestRecommendations({
    recommendations,
    recsLoading,
    userUid,
    adminUid,
    onOpenAdmin,
    handleAddToCollection,
    existingItems,
    t,
}: HomeBestRecommendationsProps) {
    const isAdmin = userUid === adminUid;
    const [selectedTab, setSelectedTab] = useState<'all' | 'movie' | 'series'>('all');
    const [currentPage, setCurrentPage] = useState(0);
    const [actionStatus, setActionStatus] = useState<Record<string, 'adding' | 'added' | 'exists'>>({});
    const PAGE_SIZE = 4;

    const filteredRecs = useMemo(() => {
        if (selectedTab === 'all') return recommendations;
        return recommendations.filter((r) => r.type === selectedTab);
    }, [recommendations, selectedTab]);

    const totalPages = Math.max(1, Math.ceil(filteredRecs.length / PAGE_SIZE));
    const currentItems = filteredRecs.slice(currentPage * PAGE_SIZE, (currentPage + 1) * PAGE_SIZE);

    const isAlreadyInLibrary = (rec: Recommendation): boolean => {
        if (!existingItems || existingItems.length === 0) return false;
        const recTitleNorm = normalizeMediaTitle(rec.title);
        return existingItems.some((item) => {
            const itemTitleNorm = normalizeMediaTitle(item.title);
            return itemTitleNorm === recTitleNorm;
        });
    };

    const onAdd = async (rec: Recommendation) => {
        if (actionStatus[rec.id]) return;
        setActionStatus((prev) => ({ ...prev, [rec.id]: 'adding' }));
        try {
            await handleAddToCollection(rec);
            setActionStatus((prev) => ({ ...prev, [rec.id]: 'added' }));
            setTimeout(() => {
                setActionStatus((prev) => {
                    const next = { ...prev };
                    delete next[rec.id];
                    return next;
                });
            }, 2500);
        } catch (error: any) {
            if (error?.message === 'already_exists') {
                setActionStatus((prev) => ({ ...prev, [rec.id]: 'exists' }));
                setTimeout(() => {
                    setActionStatus((prev) => {
                        const next = { ...prev };
                        delete next[rec.id];
                        return next;
                    });
                }, 2500);
            } else {
                setActionStatus((prev) => {
                    const next = { ...prev };
                    delete next[rec.id];
                    return next;
                });
            }
        }
    };

    const getLocalizedType = (type: string) => {
        if (type === 'movie') return t('media.movie') || 'Film';
        if (type === 'series') return t('media.series') || 'Dizi';
        if (type === 'game') return t('media.game') || 'Oyun';
        if (type === 'book') return t('media.book') || 'Kitap';
        return type;
    };

    return (
        <section className="mt-10 rounded-3xl border border-slate-200/80 bg-white/70 p-5 shadow-xs backdrop-blur-sm dark:border-zinc-800/80 dark:bg-zinc-900/50 sm:p-6">
            {/* Header */}
            <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-indigo-500/10 text-indigo-500 shadow-inner dark:bg-indigo-500/15 dark:text-indigo-400">
                        <FaMagic className="text-base" />
                    </div>
                    <div>
                        <h2 className="text-lg font-black tracking-tight text-slate-900 dark:text-white sm:text-xl">
                            {t('home.bestRecommendations') || 'Küratör Seçkisi'}
                        </h2>
                        <p className="text-xs text-slate-500 dark:text-zinc-400">
                            {t('home.curatorPicksSubtitle') || 'Özenle derlenen sinematik tavsiyeler'}
                        </p>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    {/* Filter Tabs */}
                    <div className="flex rounded-xl border border-slate-200/80 bg-slate-100/80 p-0.5 dark:border-zinc-800 dark:bg-zinc-900/80">
                        {(['all', 'movie', 'series'] as const).map((tab) => (
                            <button
                                key={tab}
                                type="button"
                                onClick={() => {
                                    setSelectedTab(tab);
                                    setCurrentPage(0);
                                }}
                                className={`cursor-pointer rounded-lg px-2.5 py-1 text-xs font-bold transition-all ${
                                    selectedTab === tab
                                        ? 'bg-white text-slate-900 shadow-xs dark:bg-zinc-700 dark:text-white'
                                        : 'text-slate-500 hover:text-slate-800 dark:text-zinc-400 dark:hover:text-white'
                                }`}
                            >
                                {tab === 'all'
                                    ? t('common.all') || 'Tümü'
                                    : tab === 'movie'
                                    ? t('media.movies') || 'Filmler'
                                    : t('media.moviesSeries') || 'Diziler'}
                            </button>
                        ))}
                    </div>

                    {/* Admin Button */}
                    {isAdmin && (
                        <button
                            type="button"
                            onClick={onOpenAdmin}
                            className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl border border-slate-200/80 bg-white px-2.5 py-1.5 text-xs font-bold text-slate-700 shadow-xs hover:bg-slate-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
                            title={t('home.adminManage') || 'Önerileri Yönet'}
                        >
                            <FaCog className="text-xs text-slate-500" />
                            <span className="hidden sm:inline">{t('home.adminManage') || 'Yönet'}</span>
                        </button>
                    )}

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="flex items-center gap-1.5 ml-1">
                            <button
                                type="button"
                                disabled={currentPage === 0}
                                onClick={() => setCurrentPage((p) => Math.max(0, p - 1))}
                                className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-xl border border-slate-200/80 bg-white text-slate-600 transition hover:bg-slate-50 disabled:opacity-30 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
                                title={t('home.prev') || 'Önceki'}
                            >
                                <FaChevronLeft className="text-[10px]" />
                            </button>
                            <span className="text-xs font-bold tabular-nums text-slate-500 dark:text-zinc-400 px-1">
                                {currentPage + 1} / {totalPages}
                            </span>
                            <button
                                type="button"
                                disabled={currentPage >= totalPages - 1}
                                onClick={() => setCurrentPage((p) => Math.min(totalPages - 1, p + 1))}
                                className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-xl border border-slate-200/80 bg-white text-slate-600 transition hover:bg-slate-50 disabled:opacity-30 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
                                title={t('home.next') || 'Sonraki'}
                            >
                                <FaChevronRight className="text-[10px]" />
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Content */}
            {recsLoading ? (
                <div className="flex flex-col items-center justify-center py-16 gap-3">
                    <FaSpinner className="h-6 w-6 animate-spin text-indigo-500" />
                    <span className="text-xs font-medium text-slate-400 dark:text-zinc-500">
                        {t('home.recommendationsLoading') || 'Öneriler hazırlanıyor...'}
                    </span>
                </div>
            ) : currentItems.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-200 py-12 text-center dark:border-zinc-800">
                    <p className="text-xs font-medium text-slate-400 dark:text-zinc-500">
                        {t('home.noRecommendations') || 'Bu kategoride henüz öneri bulunmuyor.'}
                    </p>
                </div>
            ) : (
                <AnimatePresence mode="wait">
                    <motion.div
                        key={`${currentPage}-${selectedTab}`}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        transition={{ duration: 0.25 }}
                        className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4"
                    >
                        {currentItems.map((rec) => {
                            const status = actionStatus[rec.id];
                            const alreadyInLib = isAlreadyInLibrary(rec);

                            return (
                                <div
                                    key={rec.id}
                                    className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs transition-all duration-300 hover:border-indigo-400/50 hover:shadow-lg dark:border-zinc-800/80 dark:bg-zinc-900"
                                >
                                    <div className="flex gap-3.5">
                                        {/* Poster */}
                                        <div className="relative aspect-[2/3] w-24 shrink-0 overflow-hidden rounded-xl bg-slate-100 shadow-xs dark:bg-zinc-800">
                                            {rec.image ? (
                                                <img
                                                    src={rec.image}
                                                    alt={rec.title}
                                                    className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                                                    loading="lazy"
                                                />
                                            ) : (
                                                <div className="flex h-full w-full items-center justify-center text-slate-300 dark:text-zinc-600">
                                                    <FaFilm className="text-xl" />
                                                </div>
                                            )}

                                            {rec.rating && (
                                                <div className="absolute top-1.5 left-1.5 flex items-center gap-1 rounded-md bg-black/75 px-1.5 py-0.5 text-[9px] font-bold text-amber-400 backdrop-blur-xs border border-white/10 shadow-xs">
                                                    <FaStar className="text-[8px]" />
                                                    <span>{rec.rating}</span>
                                                </div>
                                            )}
                                        </div>

                                        {/* Details */}
                                        <div className="min-w-0 flex-1 flex flex-col justify-between">
                                            <div>
                                                <div className="flex items-center gap-1.5">
                                                    <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-slate-600 dark:bg-zinc-800 dark:text-zinc-300">
                                                        {getLocalizedType(rec.type)}
                                                    </span>
                                                </div>
                                                <h3 className="mt-1.5 text-sm font-bold text-slate-900 line-clamp-1 group-hover:text-indigo-600 dark:text-white dark:group-hover:text-indigo-400 transition-colors" title={rec.title}>
                                                    {rec.title}
                                                </h3>
                                                {rec.description && (
                                                    <p className="mt-1 line-clamp-2 text-xs text-slate-500 dark:text-zinc-400 leading-relaxed">
                                                        {rec.description}
                                                    </p>
                                                )}
                                            </div>

                                            {/* Action State: If already in library, show permanent status badge */}
                                            <div className="mt-3">
                                                {alreadyInLib || status === 'exists' ? (
                                                    <div className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-500/25 bg-emerald-500/10 px-3 py-1.5 text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                                                        <FaCheck className="text-[10px]" />
                                                        <span>{t('home.inLibrary') || 'Kütüphanenizde'}</span>
                                                    </div>
                                                ) : (
                                                    <button
                                                        type="button"
                                                        onClick={() => onAdd(rec)}
                                                        disabled={status === 'adding' || status === 'added'}
                                                        className={`inline-flex cursor-pointer items-center justify-center gap-1.5 rounded-xl px-3 py-1.5 text-[11px] font-bold transition active:scale-95 ${
                                                            status === 'added'
                                                                ? 'bg-emerald-500 text-white'
                                                                : 'bg-stone-900 text-white hover:bg-indigo-600 dark:bg-zinc-800 dark:text-zinc-100 dark:hover:bg-indigo-500'
                                                        }`}
                                                    >
                                                        {status === 'adding' ? (
                                                            <>
                                                                <FaSpinner className="h-3 w-3 animate-spin" />
                                                                <span>{t('home.addingToLibrary') || 'Ekleniyor...'}</span>
                                                            </>
                                                        ) : status === 'added' ? (
                                                            <>
                                                                <FaCheck className="h-3 w-3 text-white" />
                                                                <span>{t('home.addedToLibrary') || 'Eklendi'}</span>
                                                            </>
                                                        ) : (
                                                            <>
                                                                <FaPlus className="text-[9px]" />
                                                                <span>{t('home.addToLibrary') || 'Kütüphaneye Ekle'}</span>
                                                            </>
                                                        )}
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </motion.div>
                </AnimatePresence>
            )}
        </section>
    );
}